import middy from "@middy/core";
import cors from "@middy/http-cors";
import httpErrorHandler from "@middy/http-error-handler";
import httpSecurityHeaders from "@middy/http-security-headers";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

import { OrderStatusCodes } from "../lib/db/order-status-db";
import { securityHeaders } from "../lib/http/security-headers";
import { defaultCorsOptions } from "../lib/security/cors-configuration";
import { createJsonResponse, getCorrelationIdFromEventHeaders } from "../lib/utils/utils";
import { generateReadableError } from "../lib/utils/validation-utils";
import type { ParsedOrderBody } from "../order-router-lambda";
import { buildFhirServiceRequest } from "./fhir-mapper";
import { init } from "./init";
import { OrderServiceRequestSchema } from "./order-service-request-schema";
import { OrderServiceRequest } from "./order-service-request-type";

const name = "order-service-lambda";

const parseAndValidateRequest = (eventBody: string | null): OrderServiceRequest => {
  let parsedBody: unknown;

  try {
    parsedBody = JSON.parse(eventBody || "");
  } catch (error) {
    throw new Error("Invalid JSON in request body", { cause: error });
  }

  const validationResult = OrderServiceRequestSchema.safeParse(parsedBody);
  if (!validationResult.success) {
    const errorDetails = generateReadableError(validationResult.error);
    throw new Error(`Validation failed: ${errorDetails}`);
  }

  return validationResult.data;
};

export const lambdaHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  const { transactionService, orderStatusService, sqsClient, orderPlacementQueueUrl } = init();
  let correlationId: string;

  try {
    correlationId = getCorrelationIdFromEventHeaders(event);
  } catch (error) {
    console.error(name, "Failed to retrieve correlation ID", { error });
    return createJsonResponse(400, {
      message: error instanceof Error ? error.message : "Invalid correlation ID",
    });
  }

  console.info(name, "Received order request", {
    correlationId,
    path: event.path,
    method: event.httpMethod,
  });

  try {
    if (event.body === null || event.body === "{}") {
      return createJsonResponse(400, { message: "Empty body" });
    }

    const orderRequest = parseAndValidateRequest(event.body);

    console.info(name, "Order request validated", {
      correlationId,
      supplierId: orderRequest.supplierId,
      testCode: orderRequest.testCode,
    });

    // Create patient, order, status and consent record in a single transaction.
    // ALPHA: This endpoint is not idempotent. Each invocation creates a new test_order row
    // (new order_uid) and associated order_status rows (for example, GENERATED and later QUEUED).
    // Repeating the same request (even with the same correlation ID or payload) will create
    // additional orders; callers must not rely on this API to deduplicate identical requests.
    const orderResult = await transactionService.createPatientOrderAndConsent(
      orderRequest.patient.nhsNumber,
      orderRequest.patient.birthDate,
      orderRequest.supplierId,
      orderRequest.testCode,
      correlationId,
      orderRequest.consent,
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

    try {
      await sqsClient.sendMessage(orderPlacementQueueUrl, JSON.stringify(parsedOrderBody));
    } catch (error) {
      console.error(name, "Failed to enqueue order", {
        correlationId,
        error,
      });
      return createJsonResponse(500, {
        message: "Failed to enqueue order",
      });
    }

    try {
      await orderStatusService.addOrderStatusUpdate({
        orderId: orderResult.orderUid,
        statusCode: OrderStatusCodes.QUEUED,
        createdAt: new Date().toISOString(),
        correlationId: correlationId,
      });
    } catch (error) {
      console.error(name, "Failed to update order status", {
        correlationId,
        error,
      });
      return createJsonResponse(500, {
        message: "Failed to update order status",
      });
    }

    console.info(name, "Order created successfully", {
      correlationId,
      orderUid: orderResult.orderUid,
      orderReference: orderResult.orderReference,
      patientUid: orderResult.patientUid,
    });

    return createJsonResponse(
      201,
      {
        orderUid: orderResult.orderUid,
        orderReference: orderResult.orderReference,
        message: "Order created successfully",
      },
      {
        "X-Correlation-ID": correlationId,
      },
    );
  } catch (error) {
    console.error(name, "Order request failed", { correlationId, error });
    return createJsonResponse(400, {
      message: error instanceof Error ? error.message : "Invalid request",
    });
  }
};

export const handler = middy(lambdaHandler)
  .use(httpSecurityHeaders(securityHeaders))
  .use(cors(defaultCorsOptions))
  .use(httpErrorHandler());
