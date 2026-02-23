import { Observation } from 'fhir/r4';
import { orderResultFHIRObservationSchema, Identifiers, resultCodeMapping, InterpretationCode } from './index';
import { generateReadableError } from '../lib/utils';
import { ConsoleCommons } from '../lib/commons';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { getCorrelationIdFromEventHeaders, isUUID } from '../lib/utils';
import { OrderResultSummary } from '../lib/db/order-db';
import { ErrorStatusCode } from '../lib/fhir-response';

export interface ValidationResult {
  isValid: boolean;
  isIdempotent?: boolean;
  errorCode?: ErrorStatusCode;
  errorType?: 'not-found' | 'invalid' | 'forbidden' | 'conflict';
  errorMessage?: string;
  severity?: 'error' | 'warning' | 'information';
}

export const validateBody = (body: string | null, commons: ConsoleCommons) => {
  let observation: Observation;

  try {
    if (body === '{}' || body === null) {
      throw new Error('Body is empty');
    }
    observation = JSON.parse(body);
  } catch (error) {
    commons.logError('order-result-lambda', 'Invalid JSON in request body', { error });
    throw error;
  }

  const validationResult = orderResultFHIRObservationSchema.safeParse(observation);

  if (!validationResult.success) {
    const errorDetails = generateReadableError(validationResult.error);

    commons.logError('order-result-lambda', 'Validation failed', { error: errorDetails });
    throw new Error(`FHIR Observation validation error: ${errorDetails}`);
  }
};

export function extractAndValidateObservationFields(event: APIGatewayProxyEvent, commons: ConsoleCommons): { validationResult: ValidationResult; observation?: Observation; identifiers?: Identifiers; } {
  try {
    validateBody(event.body, commons);
  } catch (error) {
    return {
      validationResult: {
        isValid: false,
        errorCode: 400,
        errorType: 'invalid',
        errorMessage: (error as Error).message,
        severity: 'error'
      }
    };
  }

  const observation: Observation = JSON.parse(event.body!);
  let correlationId: string;

  try {
    correlationId = getCorrelationIdFromEventHeaders(event);
  } catch (error) {
    commons.logError('order-result-lambda', 'Header validation failed', { error: (error as Error).message });
    return {
      validationResult: {
        isValid: false,
        errorCode: 400,
        errorType: 'invalid',
        errorMessage: (error as Error).message,
        severity: 'error'
      }
    };
  }

  let orderUid: string, patientId: string, supplierId: string;

  try {
    orderUid = extractOrderUidFromFHIRObservation(observation);
    patientId = extractPatientIdFromFHIRObservation(observation);
    supplierId = extractSupplierIdFromFHIRObservation(observation);
  } catch (error) {
    commons.logError('order-result-lambda', 'Error extracting identifiers from Observation', { error });

    return {
      validationResult: {
        isValid: false,
        errorCode: 400,
        errorType: 'invalid',
        errorMessage: 'Unable to extract necessary identifiers from Observation',
        severity: 'error',
      }
    };
  }

  const identifiers: Identifiers = {
    orderUid,
    patientId,
    supplierId,
    correlationId,
  };

  return {
    validationResult: { isValid: true },
    observation,
    identifiers,
  };
}

export async function validateDBData(
  identifiers: Identifiers,
  observation: Observation,
  testOrderResult: OrderResultSummary,
  commons: ConsoleCommons
): Promise<ValidationResult> {

  const interpretationCode = extractInterpretationCodeFromFHIRObservation(observation);
  const { orderUid, patientId, supplierId, correlationId } = identifiers;

  if (!testOrderResult) {
    commons.logError('order-result-lambda', 'Test order not found for orderUid', { orderUid });
    return {
      isValid: false,
      errorCode: 404,
      errorType: 'not-found',
      errorMessage: `No order found for orderUid ${orderUid}`,
      severity: 'error'
    };
  }

  // Idempotency check
  if (testOrderResult.correlation_id && testOrderResult.correlation_id === correlationId) {
    if (resultCodeMapping[interpretationCode] !== testOrderResult.result_status) {
      commons.logError('order-result-lambda', 'Idempotency check failed, different result detected on same correlation ID.', { orderUid, correlationId });
      return {
        isValid: false,
        errorCode: 409,
        errorType: 'conflict',
        errorMessage: 'A different result has already been submitted for this order with the same correlation ID',
        severity: 'error',
        isIdempotent: true,
      };
    }

    commons.logInfo('order-result-lambda', 'Duplicate submission with same correlation ID detected, returning success without reprocessing', { orderUid, correlationId });
    return {
      isValid: true,
      isIdempotent: true,
    };
  }

  if (testOrderResult.patient_uid !== patientId) {
    commons.logError('order-result-lambda', 'Patient ID in Observation does not match test order record', { orderUid, patientId });
    return {
      isValid: false,
      errorCode: 400,
      errorType: 'invalid',
      errorMessage: 'Patient ID in Observation does not match order record',
      severity: 'error'
    };
  }

  if (testOrderResult.supplier_id !== supplierId) {
    commons.logError('order-result-lambda', 'Supplier ID in Observation does not match test order record', { orderUid, supplierId });
    return {
      isValid: false,
      errorCode: 403,
      errorType: 'forbidden',
      errorMessage: 'Supplier not authorized for this order',
      severity: 'error'
    };
  }

  return { isValid: true };
}

export function extractOrderUidFromFHIRObservation(observation: Observation): string {
  if (observation.basedOn?.length === 0) {
    throw new Error('Observation.basedOn is empty');
  }

  const reference = observation.basedOn?.[0]?.reference;

  if (!reference) {
    throw new Error('Observation.basedOn[0].reference is missing');
  }

  // Extract UUID from reference like "ServiceRequest/550e8400-e29b-41d4-a716-446655440000"
  const parts = reference.split('/');
  if (parts.length !== 2) {
    throw new Error('Invalid basedOn reference format');
  }

  const orderUID = parts[1];

  if (!isUUID(orderUID)) {
    throw new Error('Invalid orderUID format');
  }

  return orderUID;
}

export function extractPatientIdFromFHIRObservation(observation: Observation): string {
  const parts = observation.subject!.reference!.split('/');
  if (parts.length !== 2) {
    throw new Error('Invalid subject reference format');
  }

  const patientId = parts[1];

  if (!isUUID(patientId)) {
    throw new Error('Invalid patient ID format');
  }

  return patientId;
}

export function extractSupplierIdFromFHIRObservation(observation: Observation): string {
  const parts = observation.performer![0].reference!.split('/');
  if (parts.length !== 2) {
    throw new Error('Invalid performer reference format');
  }

  return parts[1];
}

export function extractInterpretationCodeFromFHIRObservation(observation: Observation): InterpretationCode {
  return observation.interpretation![0].coding![0].code as InterpretationCode;
}
