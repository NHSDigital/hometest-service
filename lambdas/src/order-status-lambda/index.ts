import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { z } from "zod";
import { FHIRTaskSchema } from "../lib/models/fhir/fhir-schemas";
import { FHIRTask } from "../lib/models/fhir/fhir-service-request-type";
import {
  createFhirErrorResponse,
  createFhirResponse,
} from "../lib/fhir-response";
import { ConsoleCommons } from "../lib/commons";
import { init } from "./init";
import { OrderStatusUpdateParams } from "src/lib/db/order-status-db";
import { getCorrelationIdFromEventHeaders } from "../lib/utils";
import {
  AllowedInternalBusinessStatuses,
  IncomingBusinessStatus,
} from "./types";

const commons = new ConsoleCommons();
const name = "order-status-lambda";

/**
 * Lambda handler for PUT /test-order/status endpoint
 * Updates the status of an existing test order using FHIR Task resource
 */
export const handler = async (
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

  // Validate FHIR Task schema
  const validationResult = FHIRTaskSchema.safeParse(task);

  if (!validationResult.success) {
    let errorDetails: string = z.prettifyError(validationResult.error);
    errorDetails = errorDetails.replace(/(?:\u2716 |\r?\n )/g, "");

    commons.logError(name, "Task validation failed", {
      error: errorDetails,
    });

    return createFhirErrorResponse(400, "invalid", errorDetails, "error");
  }

  try {
    // Extract order ID from Task.basedOn
    const orderId = extractIdFromReference(task.basedOn[0].reference);

    if (!orderId) {
      commons.logError(name, "Invalid order reference format", {
        reference: task.basedOn[0].reference,
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

    // Check if order exists
    const existingOrder = await orderStatusDb.getOrder(orderId);
    if (!existingOrder) {
      commons.logError(name, "Order not found", { orderId });

      return createFhirErrorResponse(
        404,
        "not-found",
        `Order with id ${orderId} not found`,
        "error",
      );
    }

    // Verify patient ownership
    const patientIdFromTask = extractIdFromReference(task.for.reference);

    if (!patientIdFromTask) {
      commons.logError(name, "Invalid patient reference format", {
        reference: task.for.reference,
      });

      return createFhirErrorResponse(
        400,
        "invalid",
        "Invalid patient reference format",
        "error",
      );
    }

    if (patientIdFromTask !== existingOrder.patient_uid) {
      commons.logError(name, "Patient mismatch for order", {
        orderId,
        expectedPatient: existingOrder.patient_uid,
        providedPatient: patientIdFromTask,
      });

      return createFhirErrorResponse(
        400,
        "invalid",
        "Patient ID does not match the order",
        "error",
      );
    }

    // Validate business status
    const businessStatusCode =
      task.businessStatus?.text || task.businessStatus?.coding?.[0]?.code; // TODO: Verify we need to the code version

    if (!isValidBusinessStatus(businessStatusCode)) {
      commons.logError(name, "Invalid business status", {
        businessStatus: businessStatusCode,
      });

      return createFhirErrorResponse(
        400,
        "invalid",
        `Invalid business status: ${businessStatusCode}. Allowed values: ${Object.values(AllowedInternalBusinessStatuses).join(", ")}`,
        "error",
      );
    }

    // Timestamp validation
    const { authoredOn, lastModified } = task;

    if (!authoredOn && !lastModified) {
      commons.logError(name, "Missing timestamp in task", { orderId });

      return createFhirErrorResponse(
        400,
        "invalid",
        "Task must contain either authoredOn or lastModified timestamp",
        "error",
      );
    }

    // Check for idempotency via Correlation ID
    const idempotencyCheck = await orderStatusDb.checkIdempotency(
      orderId,
      correlationId,
    );

    if (idempotencyCheck.isDuplicate && idempotencyCheck.lastUpdate) {
      commons.logInfo(name, "Duplicate update detected via correlation ID", {
        orderId,
        correlationId,
      });

      return createFhirResponse(200, task);
    }

    // Process the update
    const updateParams: OrderStatusUpdateParams = {
      orderId,
      statusCode: task.status,
      createdAt: (lastModified || authoredOn)!,
      correlationId,
    };

    await orderStatusDb.updateOrderStatus(updateParams);

    commons.logInfo(name, "Order status updated successfully", {
      orderId,
      statusCode: task.status,
      correlationId,
    });

    // Return updated Task resource
    return createFhirResponse(200, task); // TODO: Check if we want to return what persisted in the database instead of the incoming Task
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

/**
 * Extract UUID from a FHIR reference (e.g., "ServiceRequest/550e8400-e29b-41d4-a716-446655440000")
 */
const extractIdFromReference = (reference: string): string | null => {
  const parts = reference.split("/");

  return parts.length === 2 ? parts[1] : null;
};

/**
 * Validate business status against allowed domain-specific statuses
 */
const allowedBusinessStatusMapping: Record<
  IncomingBusinessStatus,
  AllowedInternalBusinessStatuses
> = {
  [IncomingBusinessStatus.DISPATCHED]:
    AllowedInternalBusinessStatuses.DISPATCHED,
  [IncomingBusinessStatus.RECEIVED_AT_LAB]:
    AllowedInternalBusinessStatuses.RECEIVED,
};

export const isValidBusinessStatus = (status?: string): boolean => {
  if (!status) return true;

  return Object.keys(allowedBusinessStatusMapping).includes(status);
};
