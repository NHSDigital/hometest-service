import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { z } from "zod";
import { OrderServiceRequestSchema } from "./order-service-request-schema";
import { OrderServiceRequest } from "./order-service-request-type";
import { createJsonResponse, getCorrelationIdFromEventHeaders } from "../lib/utils";
import { init } from "./init";
import type { ParsedOrderBody } from "../order-router-lambda";
import { buildFhirServiceRequest } from "./fhir-mapper";
import { OrderStatusCodes } from "../lib/db/order-status-db";

const name = "order-service-lambda";
const { transactionService, orderStatusService, sqsClient, orderPlacementQueueUrl } = init();

const parseAndValidateRequest = (eventBody: string | null): OrderServiceRequest => {
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

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
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

    // Create patient, order, status and consent record in a single transaction
    // ALPHA: no real idempotency check, but repeated requests should throw because of unique constraint on order_status.order_uid, which is generated as a UUID in createPatientOrderAndConsent
    const orderResult = await transactionService.createPatientOrderAndConsent(
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
      await orderStatusService.updateOrderStatus({
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

    return createJsonResponse(201, {
      orderUid: orderResult.orderUid,
      orderReference: orderResult.orderReference,
      message: "Order created successfully",
    });
  } catch (error) {
    console.error(name, "Order request failed", { correlationId, error });
    return createJsonResponse(400, {
      message: error instanceof Error ? error.message : "Invalid request",
    });
  }
};
