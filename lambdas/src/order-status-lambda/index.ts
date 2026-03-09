import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  FHIRCodeableConceptSchema, FHIRIdentifierSchema,
  FHIRReferenceSchema,
  FHIRTaskSchema,
} from "../lib/models/fhir/fhir-schemas";
import { createFhirErrorResponse, createFhirResponse } from "../lib/fhir-response";
import { ConsoleCommons } from "../lib/commons";
import { init } from "./init";
import { OrderStatusUpdateParams } from "src/lib/db/order-status-db";
import { businessStatusMapping, extractIdFromReference } from "./utils";
import httpErrorHandler from "@middy/http-error-handler";
import middy from "@middy/core";
import cors from "@middy/http-cors";
import httpSecurityHeaders from "@middy/http-security-headers";
import { securityHeaders } from "../lib/http/security-headers";
import { defaultCorsOptions } from "../lib/security/cors-configuration";
import z from "zod";
import { IncomingBusinessStatus } from "./types";
import { getCorrelationIdFromEventHeaders } from "../lib/utils/utils";

const commons = new ConsoleCommons();
const { orderStatusDb } = init();
const name = "order-status-lambda";

const orderStatusFHIRTaskSchema = FHIRTaskSchema.extend({
  identifier: z.array(FHIRIdentifierSchema).min(1),
  for: FHIRReferenceSchema,
  basedOn: z.array(FHIRReferenceSchema).min(1).max(1),
  lastModified: z.string().datetime(),
  businessStatus: FHIRCodeableConceptSchema.extend({
    text: z.enum(IncomingBusinessStatus),
  }),
});

export type OrderStatusFHIRTask = z.infer<typeof orderStatusFHIRTaskSchema>;

/**
 * Lambda handler for POST /test-order/status endpoint
 * Adds a status record for a given order based on the incoming FHIR Task resource
 */
export const lambdaHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  commons.logInfo(name, "Received order status update request", {
    path: event.path,
    method: event.httpMethod,
  });

  let task: unknown;

  if (!event.body) {
    commons.logError(name, "Missing request body");

    return createFhirErrorResponse(400, "invalid", "Request body is required", "error");
  }

  try {
    task = JSON.parse(event.body);
  } catch (error) {
    commons.logError(name, "Invalid JSON in request body", { error });

    return createFhirErrorResponse(400, "invalid", "Invalid JSON in request body", "error");
  }

  const validationResult = orderStatusFHIRTaskSchema.safeParse(task);

  if (!validationResult.success) {
    const errorDetails = validationResult.error.issues
      .map((err) => `${err.path.join(".")}: ${err.message}`)
      .join("; ");

    commons.logError(name, "Task validation failed", {
      error: errorDetails,
    });

    return createFhirErrorResponse(400, "invalid", errorDetails, "error");
  }

  const validatedTask = validationResult.data;

  try {
    const orderId = validatedTask.identifier[0].value;

    if (!orderId) {
      commons.logError(name, "Invalid order reference format", {
        reference: validatedTask.identifier[0].value,
      });

      return createFhirErrorResponse(400, "invalid", "Invalid order reference format", "error");
    }

    let correlationId: string;

    try {
      correlationId = getCorrelationIdFromEventHeaders(event);
    } catch (error) {
      commons.logError(name, "Failed to retrieve correlation ID", { error });

      return createFhirErrorResponse(
        400,
        "invalid",
        error instanceof Error ? error.message : "Invalid correlation ID",
        "error",
      );
    }

    // Verify order exists and retrieve associated patient ID
    const orderPatientId = await orderStatusDb.getPatientIdFromOrder(orderId);

    if (!orderPatientId) {
      commons.logError(name, "Order not found", { orderId });

      return createFhirErrorResponse(
        404,
        "not-found",
        `Order with id ${orderId} not found`,
        "error",
      );
    }

    // Verify patient ownership
    const patientIdFromTask = extractIdFromReference(validatedTask.for.reference);

    if (!patientIdFromTask) {
      commons.logError(name, "Invalid patient reference format", {
        reference: validatedTask.for.reference,
      });

      return createFhirErrorResponse(400, "invalid", "Invalid patient reference format", "error");
    }

    if (patientIdFromTask !== orderPatientId) {
      commons.logError(name, "Patient mismatch for order", {
        orderId,
        expectedPatient: orderPatientId,
        providedPatient: patientIdFromTask,
      });

      return createFhirErrorResponse(
        400,
        "invalid",
        "Patient ID does not match the order",
        "error",
      );
    }

    // Check for idempotency via Correlation ID
    const idempotencyCheck = await orderStatusDb.checkIdempotency(orderId, correlationId);

    if (idempotencyCheck.isDuplicate) {
      commons.logInfo(name, "Duplicate update detected via correlation ID", {
        orderId,
        correlationId,
      });

      return createFhirResponse(200, validatedTask);
    }

    // Process the update
    const statusOrderUpdateParams: OrderStatusUpdateParams = {
      orderId,
      statusCode: businessStatusMapping[validatedTask.businessStatus.text],
      createdAt: validatedTask.lastModified,
      correlationId,
    };

    await orderStatusDb.addOrderStatusUpdate(statusOrderUpdateParams);

    commons.logInfo(name, "Order status update added successfully", statusOrderUpdateParams);

    return createFhirResponse(201, validatedTask);
  } catch (error) {
    commons.logError(name, "Error processing order status update", {
      error,
    });
    return createFhirErrorResponse(500, "exception", "An internal error occurred", "fatal");
  }
};

export const handler = middy(lambdaHandler)
  .use(httpSecurityHeaders(securityHeaders))
  .use(cors(defaultCorsOptions))
  .use(httpErrorHandler());
