import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { z } from "zod";
import { OrderServiceRequestSchema } from "./order-service-request-schema";
import { OrderServiceRequest } from "./order-service-request-type";
import { createJsonResponse } from "../lib/utils";
import { init } from "./init";

const name = "order-service-lambda";
const { supplierService } = init();

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

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  console.info(name, "Received order request", {
    path: event.path,
    method: event.httpMethod,
  });

  try {
    if (event.body === null || event.body === "{}") {
      return createJsonResponse(400, { message: "Empty body" });
    }

    const orderRequest = parseAndValidateRequest(event.body);

    console.info(name, "Order request validated", {
      supplierId: orderRequest.supplierId,
      testCode: orderRequest.testCode,
    });

    // Create patient and order in database
    // ALPHA: no real idempotency check, so repeated requests will create multiple orders
    const orderResult = await supplierService.createPatientAndOrder(
      orderRequest.patient.nhsNumber,
      orderRequest.patient.birthDate,
      orderRequest.supplierId,
      orderRequest.testCode,
    );

    console.info(name, "Order created successfully", {
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
    console.error(name, "Order request failed", { error });
    return createJsonResponse(400, {
      message: error instanceof Error ? error.message : "Invalid request",
    });
  }
};
