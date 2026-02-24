import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import middy from "@middy/core";
import cors, { Options as CorsOptions } from "@middy/http-cors";
import httpErrorHandler from "@middy/http-error-handler";
import httpSecurityHeaders from "@middy/http-security-headers";
import { z } from "zod";
import { OrderServiceRequestSchema } from "./order-service-request-schema";
import { OrderServiceRequest } from "./order-service-request-type";
import {
  createJsonResponse,
  getCorrelationIdFromEventHeaders,
} from "../lib/utils";
import { init } from "./init";
import type { ParsedOrderBody } from "../order-router-lambda";
import { buildFhirServiceRequest } from "./fhir-mapper";
import { OrderStatusCodes } from "../lib/db/order-status-db";
import { securityHeaders } from "../lib/http/security-headers";
import { defaultCorsOptions } from "../login-lambda/cors-configuration";

const name = "order-service-lambda";

const {
  transactionService,
  orderStatusService,
  sqsClient,
  orderPlacementQueueUrl,
} = init();

const parseAndValidateRequest = (
  eventBody: string | null,
): OrderServiceRequest => {
  let parsedBody: unknown;

  try {
    parsedBody = JSON.parse(eventBody || "");
  } catch (error) {
    throw new Error("Invalid JSON in request body", { cause: error });
  }

  const validationResult = OrderServiceRequestSchema.safeParse(parsedBody);
  if (!validationResult.success) {
    let errorDetails = z.prettifyError(validationResult.error);
    errorDetails = errorDetails.replace(/(?:\u2716 |\r?\n )/g, "");
    throw new Error(`Validation failed: ${errorDetails}`);
  }

  return validationResult.data;
};

export const lambdaHandler = async (
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  context.callbackWaitsForEmptyEventLoop = false;

  let correlationId: string;

  try {
    correlationId = getCorrelationIdFromEventHeaders(event);
  } catch (error) {
    console.error(name, "Failed to retrieve correlation ID", { error });
    return createJsonResponse(400, {
      message:
        error instanceof Error ? error.message : "Invalid correlation ID",
    });
  }

  console.info(name, "Received order request", {
    correlationId,
    path: event.path,
    method: event.httpMethod,
  });

  try {
    if (!event.body || event.body === "{}") {
      return createJsonResponse(400, { message: "Empty body" });
    }

    const orderRequest = parseAndValidateRequest(event.body);

    const orderResult =
      await transactionService.createPatientAndOrderAndStatus(
        orderRequest.patient.nhsNumber,
        orderRequest.patient.birthDate,
        orderRequest.supplierId,
        orderRequest.testCode,
        correlationId,
      );

    const orderBody = buildFhirServiceRequest(
      orderRequest,
      orderResult.patientUid,
      orderResult.orderUid,
    );

    const parsedOrderBody: ParsedOrderBody = {
      supplier_code: orderRequest.supplierId,
      correlation_id: correlationId,
      order_body: orderBody,
    };

    await sqsClient.sendMessage(
      orderPlacementQueueUrl,
      JSON.stringify(parsedOrderBody),
    );

    await orderStatusService.updateOrderStatus({
      orderId: orderResult.orderUid,
      statusCode: OrderStatusCodes.QUEUED,
      createdAt: new Date().toISOString(),
      correlationId,
    });

    return createJsonResponse(201, {
      orderUid: orderResult.orderUid,
      orderReference: orderResult.orderReference,
      message: "Order created successfully",
    });
  } catch (error) {
    console.error(name, "Order request failed", { correlationId, error });

    return createJsonResponse(
      error instanceof Error ? 400 : 500,
      {
        message: error instanceof Error ? error.message : "Internal error",
      },
    );
  }
};

const corsOptions: CorsOptions = {
  ...defaultCorsOptions,
  headers: [
    "content-type",
    "authorization",
    "x-correlation-id",
  ].join(","),
};

export const handler = middy(lambdaHandler)
  .use(httpSecurityHeaders(securityHeaders))
  .use(cors(corsOptions))
  .use(httpErrorHandler());
