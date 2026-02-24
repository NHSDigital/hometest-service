import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  FHIRCodeableConceptSchema,
  FHIRReferenceSchema,
  FHIRTaskSchema,
} from "../lib/models/fhir/fhir-schemas";
import { FHIRTask } from "../lib/models/fhir/fhir-service-request-type";
import {
  createFhirErrorResponse,
  createFhirResponse,
} from "../lib/fhir-response";
import { ConsoleCommons } from "../lib/commons";
import { init } from "./init";
import { OrderStatusUpdateParams } from "src/lib/db/order-status-db";
import { getCorrelationIdFromEventHeaders } from "../lib/utils";
import { businessStatusMapping, extractIdFromReference } from "./utils";
import httpErrorHandler from "@middy/http-error-handler";
import middy from "@middy/core";
import cors from "@middy/http-cors";
import httpSecurityHeaders from "@middy/http-security-headers";
import { securityHeaders } from "../lib/http/security-headers";
import { defaultCorsOptions } from "../login-lambda/cors-configuration";
import z from "zod";
import { IncomingBusinessStatus } from "./types";

const commons = new ConsoleCommons();
const name = "order-status-lambda";

const orderStatusFHIRTaskSchema = FHIRTaskSchema.extend({
  for: FHIRReferenceSchema,
  basedOn: z.array(FHIRReferenceSchema).max(1),
  lastModified: z.string().datetime(),
  businessStatus: FHIRCodeableConceptSchema.extend({
    text: z.enum(IncomingBusinessStatus),
  }),
});

export type OrderStatusFHIRTask = z.infer<typeof orderStatusFHIRTaskSchema>;

/**
 * Lambda handler for PUT /test-order/status endpoint
 * Updates the status of an existing test order using FHIR Task resource
 */
export const lambdaHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  const { orderStatusDb } = init();

  commons.logInfo(name, "Received order status update request", {
    path: event.path,
    method: event.httpMethod,
  });

  let task: FHIRTask;

  // Parse and validate request body
  try {
    if (event.body === "{}" || event.body === null) {
      throw new Error("Empty body");
    }

    task = JSON.parse(event.body);
  } catch (error) {
    commons.logError(name, "Invalid JSON in request body", { error });

    return createFhirErrorResponse(
      400,
      "invalid",
      "Invalid JSON in request body",
      "error",
    );
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
    // Extract order ID from Task.basedOn
    const orderId = extractIdFromReference(validatedTask.basedOn[0].reference);

    if (!orderId) {
      commons.logError(name, "Invalid order reference format", {
        reference: validatedTask.basedOn[0].reference,
      });

      return createFhirErrorResponse(
        400,
        "invalid",
        "Invalid order reference format",
        "error",
      );
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
    const patientIdFromTask = extractIdFromReference(
      validatedTask.for.reference,
    );

    if (!patientIdFromTask) {
      commons.logError(name, "Invalid patient reference format", {
        reference: validatedTask.for.reference,
      });

      return createFhirErrorResponse(
        400,
        "invalid",
        "Invalid patient reference format",
        "error",
      );
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

    const internalBusinessStatus =
      businessStatusMapping[validatedTask.businessStatus.text];

    // Check for idempotency via Correlation ID
    const idempotencyCheck = await orderStatusDb.checkIdempotency(
      orderId,
      correlationId,
    );

    if (idempotencyCheck.isDuplicate) {
      commons.logInfo(name, "Duplicate update detected via correlation ID", {
        orderId,
        correlationId,
      });

      return createFhirResponse(200, validatedTask);
    }

    // Process the update
    const updateParams: OrderStatusUpdateParams = {
      orderId,
      statusCode: internalBusinessStatus,
      createdAt: validationResult.data.lastModified,
      correlationId,
    };

    await orderStatusDb.addOrderStatusUpdate(updateParams);

    commons.logInfo(name, "Order status updated successfully", {
      orderId,
      statusCode: internalBusinessStatus,
      correlationId,
    });

    return createFhirResponse(200, validatedTask);
  } catch (error) {
    commons.logError(name, "Error processing order status update", {
      error,
    });
    return createFhirErrorResponse(
      500,
      "exception",
      "An internal error occurred",
      "fatal",
    );
  }
};

export const handler = middy(lambdaHandler)
  .use(httpSecurityHeaders(securityHeaders))
  .use(cors(defaultCorsOptions))
  .use(httpErrorHandler());
