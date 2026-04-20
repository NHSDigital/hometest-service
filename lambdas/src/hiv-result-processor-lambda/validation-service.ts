import { APIGatewayProxyEvent } from "aws-lambda";
import { Observation } from "fhir/r4";

import { ConsoleCommons } from "../lib/commons";
import { OrderResultSummary } from "../lib/db/order-db";
import { getCorrelationIdFromEventHeaders, isUUID } from "../lib/utils/utils";
import { generateReadableError } from "../lib/utils/validation-utils";
import {
  Identifiers,
  InterpretationCode,
  orderResultFHIRObservationSchema,
  resultCodeMapping,
} from "./models";
import { ValidationResult, ValidationResultError, errorResult, successResult } from "./validation";

function invalidErrorResult(errorMessage: string): ValidationResultError {
  return errorResult({
    errorCode: 400,
    errorType: "invalid",
    errorMessage: errorMessage,
    severity: "error",
  });
}

export const validateAndExtractObservation = (
  body: string | null,
  commons: ConsoleCommons,
): Observation => {
  let observation: Observation;

  try {
    if (body === "{}" || body === null) {
      throw new Error("Body is empty");
    }
    observation = JSON.parse(body);
  } catch (error) {
    commons.logError("order-result-lambda", "Invalid JSON in request body", { error });
    throw error;
  }

  const validationResult = orderResultFHIRObservationSchema.safeParse(observation);

  if (!validationResult.success) {
    const errorDetails = generateReadableError(validationResult.error);

    commons.logError("order-result-lambda", "Validation failed", { error: errorDetails });
    throw new Error(`FHIR Observation validation error: ${errorDetails}`);
  }

  return observation;
};

export function extractAndValidateObservationFields(
  event: APIGatewayProxyEvent,
  commons: ConsoleCommons,
): ValidationResult<{ observation: Observation; identifiers: Identifiers }> {
  let observation: Observation;
  try {
    observation = validateAndExtractObservation(event.body, commons);
  } catch (error) {
    return invalidErrorResult((error as Error).message);
  }

  let correlationId: string;

  try {
    correlationId = getCorrelationIdFromEventHeaders(event);
  } catch (error) {
    commons.logError("order-result-lambda", "Header validation failed", {
      error: (error as Error).message,
    });
    return invalidErrorResult((error as Error).message);
  }

  let orderUid: string, patientId: string, supplierId: string;

  try {
    orderUid = extractOrderUidFromFHIRObservation(observation);
    patientId = extractPatientIdFromFHIRObservation(observation);
    supplierId = extractSupplierIdFromFHIRObservation(observation);
  } catch (error) {
    commons.logError("order-result-lambda", "Error extracting identifiers from Observation", {
      error,
    });

    return invalidErrorResult("Unable to extract necessary identifiers from Observation");
  }

  const identifiers: Identifiers = {
    orderUid,
    patientId,
    supplierId,
    correlationId,
  };

  return successResult({
    observation,
    identifiers,
  });
}

export async function validateDBData(
  identifiers: Identifiers,
  observation: Observation,
  testOrderResult: OrderResultSummary,
  commons: ConsoleCommons,
): Promise<ValidationResult<{ isIdempotent: boolean }>> {
  const interpretationCode = extractInterpretationCodeFromFHIRObservation(observation);
  const { orderUid, patientId, supplierId, correlationId } = identifiers;

  if (!testOrderResult) {
    commons.logError("order-result-lambda", "Test order not found for orderUid", { orderUid });
    return errorResult({
      errorCode: 404,
      errorType: "not-found",
      errorMessage: `No order found for orderUid ${orderUid}`,
      severity: "error",
    });
  }

  // Idempotency check
  if (testOrderResult.correlation_id && testOrderResult.correlation_id === correlationId) {
    if (resultCodeMapping[interpretationCode] !== testOrderResult.result_status) {
      commons.logError(
        "order-result-lambda",
        "Idempotency check failed, different result detected on same correlation ID.",
        { orderUid, correlationId },
      );
      return errorResult({
        errorCode: 409,
        errorType: "conflict",
        errorMessage:
          "A different result has already been submitted for this order with the same correlation ID",
        severity: "error",
      });
    }

    commons.logInfo(
      "order-result-lambda",
      "Duplicate submission with same correlation ID detected, returning success without reprocessing",
      { orderUid, correlationId },
    );
    return successResult({
      isIdempotent: true,
    });
  }

  if (testOrderResult.patient_uid !== patientId) {
    commons.logError(
      "order-result-lambda",
      "Patient ID in Observation does not match test order record",
      { orderUid, patientId },
    );
    return invalidErrorResult("Patient ID in Observation does not match order record");
  }

  if (testOrderResult.supplier_id !== supplierId) {
    commons.logError(
      "order-result-lambda",
      "Supplier ID in Observation does not match test order record",
      { orderUid, supplierId },
    );
    return errorResult({
      errorCode: 403,
      errorType: "forbidden",
      errorMessage: "Supplier not authorized for this order",
      severity: "error",
    });
  }

  return successResult({ isIdempotent: false });
}

export function extractOrderUidFromFHIRObservation(observation: Observation): string {
  if (observation.basedOn?.length === 0) {
    throw new Error("Observation.basedOn is empty");
  }

  const reference = observation.basedOn?.[0]?.reference;

  if (!reference) {
    throw new Error("Observation.basedOn[0].reference is missing");
  }

  // Extract UUID from reference like "ServiceRequest/550e8400-e29b-41d4-a716-446655440000"
  const parts = reference.split("/");
  if (parts.length !== 2) {
    throw new Error("Invalid basedOn reference format");
  }

  const orderUID = parts[1];

  if (!isUUID(orderUID)) {
    throw new Error("Invalid orderUID format");
  }

  return orderUID;
}

export function extractPatientIdFromFHIRObservation(observation: Observation): string {
  const parts = observation.subject!.reference!.split("/");
  if (parts.length !== 2) {
    throw new Error("Invalid subject reference format");
  }

  const patientId = parts[1];

  if (!isUUID(patientId)) {
    throw new Error("Invalid patient ID format");
  }

  return patientId;
}

export function extractSupplierIdFromFHIRObservation(observation: Observation): string {
  const parts = observation.performer![0].reference!.split("/");
  if (parts.length !== 2) {
    throw new Error("Invalid performer reference format");
  }

  return parts[1];
}

export function extractInterpretationCodeFromFHIRObservation(
  observation: Observation,
): InterpretationCode {
  return observation.interpretation![0].coding![0].code as InterpretationCode;
}
