import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

import { ConsoleCommons } from "../lib/commons";
import { type OrderPatientReference } from "../lib/db/order-db";
import { createFhirErrorResponse, createFhirResponse } from "../lib/fhir-response";
import { type FHIRTask } from "../lib/models/fhir/fhir-service-request-type";
import { ResultStatus } from "../lib/types/status";
import { getCorrelationIdFromEventHeaders, isUUID } from "../lib/utils/utils";
import { generateReadableError } from "../lib/utils/validation-utils";
import { init } from "./init";
import { resultStatusFHIRTaskSchema } from "./models";

function parseAndValidateTask(body: string | null, commons: ConsoleCommons): FHIRTask {
  let parsedTask: string;

  if (!body) {
    commons.logError("result-status-lambda", "Missing request body");
    throw new Error("Request body is required");
  }

  try {
    parsedTask = JSON.parse(body);
  } catch (error) {
    commons.logError("result-status-lambda", "Invalid JSON in request body", { error });
    throw new Error("Invalid JSON in request body", { cause: error });
  }

  const validationResult = resultStatusFHIRTaskSchema.safeParse(parsedTask);

  if (!validationResult.success) {
    const errorDetails = generateReadableError(validationResult.error);
    commons.logError("result-status-lambda", "Task validation failed", { error: errorDetails });
    throw new Error(`Task validation failed: ${errorDetails}`);
  }

  return validationResult.data;
}

function extractPatientIdFromFHIRTask(task: FHIRTask): string {
  const parts = task.for.reference.split("/");
  if (parts.length !== 2) {
    throw new Error("Invalid for.reference format");
  }

  const patientId = parts[1];

  if (!isUUID(patientId)) {
    throw new Error("Invalid patient ID format");
  }

  return patientId;
}

function extractOrderUidFromFHIRTask(task: FHIRTask): string {
  const orderUid = task.identifier?.[0]?.value;

  if (!orderUid) {
    throw new Error("Missing identifier.value");
  }
  if (!isUUID(orderUid)) {
    throw new Error("Invalid identifier.value format");
  }

  return orderUid;
}

/**
 * Lambda handler for POST /result/status endpoint
 * Accepts FHIR Task resources and updates result status on database after validation and business logic checks.
 * Returns appropriate FHIR responses for success and error cases.
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { commons, resultService, orderService } = init();
  commons.logInfo("result-status-lambda", "Received result status request", {
    path: event.path,
    method: event.httpMethod,
  });

  let task: FHIRTask;

  try {
    task = parseAndValidateTask(event.body, commons);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request body";
    return createFhirErrorResponse(400, "invalid", message, "error");
  }

  let patientUID: string, orderUID: string;

  try {
    patientUID = extractPatientIdFromFHIRTask(task);
    orderUID = extractOrderUidFromFHIRTask(task);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid identifiers";
    commons.logError("result-status-lambda", "Failed to extract identifiers from FHIR Task", {
      error,
    });
    return createFhirErrorResponse(400, "invalid", message, "error");
  }

  let orderSummary: OrderPatientReference | null;

  try {
    orderSummary = await orderService.retrievePatientIdFromOrder(orderUID);
  } catch (error) {
    commons.logError("result-status-lambda", "Failed to retrieve order details from database", {
      error,
      orderUID,
    });
    return createFhirErrorResponse(500, "exception", "An internal error occurred", "fatal");
  }

  if (!orderSummary) {
    commons.logError("result-status-lambda", "Order not found for given order UID", { orderUID });
    return createFhirErrorResponse(404, "not_found", "Order not found", "error");
  }

  if (orderSummary.patient_uid !== patientUID) {
    commons.logError("result-status-lambda", "Patient UID in Task does not match order record", {
      orderUID,
    });
    return createFhirErrorResponse(
      403,
      "forbidden",
      "Patient UID does not match order record",
      "error",
    );
  }

  const correlationId = getCorrelationIdFromEventHeaders(event);

  try {
    await resultService.updateResultStatus(orderUID, ResultStatus.Result_Available, correlationId);
  } catch (error) {
    commons.logError("result-status-lambda", "Failed to update result status in database", {
      error,
      orderUID,
    });
    return createFhirErrorResponse(500, "exception", "An internal error occurred", "fatal");
  }

  return createFhirResponse(201, task);
};
