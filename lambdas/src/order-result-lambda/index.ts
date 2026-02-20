import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Observation } from 'fhir/r4';
import { z } from 'zod';
import { createFhirErrorResponse, createFhirResponse, ErrorStatusCode } from '../lib/fhir-response';
import { isUUID } from 'src/lib/utils';
import { init } from './init';
import { OrderResultSummary } from '../lib/db/order-db';
import { FHIRObservationSchema, FHIRReferenceSchema, FHIRCodeableConceptSchema } from 'src/lib/models/fhir/fhir-schemas';
import {getCorrelationIdFromEventHeaders} from "../lib/utils";
import { OrderStatus, ResultStatus } from 'src/lib/types/status';


const { commons, orderService } = init();

// Apply business logic specific to order results on top of schema:
// remove optionality for fields we require and only accept status of 'final'
const orderResultInterpretationCodingSchema = FHIRCodeableConceptSchema.extend({
  coding: z.array(
    z.object({
      code: z.enum(['N', 'A']),
    })
  ).min(1),
})

const orderResultFHIRObservationSchema = FHIRObservationSchema.extend({
  basedOn: z.array(FHIRReferenceSchema),
  status: z.literal('final'),
  subject: FHIRReferenceSchema,
  performer: z.array(FHIRReferenceSchema),
  valueCodeableConcept: FHIRCodeableConceptSchema,
  interpretation: z.array(orderResultInterpretationCodingSchema),
})

enum InterpretationCode {
  Normal = 'N',
  Abnormal = 'A',
}

const resultCodeMapping: { [key in InterpretationCode ]: string } = {
  [InterpretationCode.Normal]: ResultStatus.Result_Available,
  [InterpretationCode.Abnormal]: ResultStatus.Result_Withheld,
};

interface Identifiers {
  orderUid: string;
  patientId: string;
  supplierId: string;
  correlationId: string;
}

interface ValidationResult {
  isValid: boolean;
  isIdempotent?: boolean;
  errorCode?: ErrorStatusCode;
  errorType?: 'not-found' | 'invalid' | 'forbidden' | 'conflict';
  errorMessage?: string;
  severity?: 'error' | 'warning' | 'information';
}

const generateReadableError = (error: z.ZodError) => {
  return z.prettifyError(error).replace(/(?:\u2716 |\r?\n )/g, '');
}

const validateBody = (body: string | null) => {
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

    commons.logError('order-result-lambda', 'Validation failed', { error: errorDetails});
    throw new Error(`FHIR Observation validation error: ${errorDetails}`);
  }
}

function extractOrderUidFromFHIRObservation(observation: Observation): string {
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

  if(!isUUID(orderUID)) {
    throw new Error('Invalid orderUID format');
  }

  return orderUID;
}

function extractPatientIdFromFHIRObservation(observation: Observation): string {
  const parts = observation.subject!.reference!.split('/');
  if (parts.length !== 2) {
    throw new Error('Invalid subject reference format');
  }

  const patientId = parts[1];

  if(!isUUID(patientId)) {
    throw new Error('Invalid patient ID format');
  }

  return patientId;
}

function extractSupplierIdFromFHIRObservation(observation: Observation): string {
  const parts = observation.performer![0].reference!.split('/');
  if (parts.length !== 2) {
    throw new Error('Invalid performer reference format');
  }

  return parts[1];
}

function extractInterpretationCodeFromFHIRObservation(observation: Observation): InterpretationCode {
  return observation.interpretation![0].coding![0].code as InterpretationCode;
}

function extractAndValidateObservationFields(event: APIGatewayProxyEvent): { validationResult: ValidationResult, observation?: Observation, identifiers?: Identifiers } {
  try {
    validateBody(event.body);
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

async function validateDBData(
  identifiers: Identifiers,
  observation: Observation,
  testOrderResult: OrderResultSummary,
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
      }
    }

    commons.logInfo('order-result-lambda', 'Duplicate submission with same correlation ID detected, returning success without reprocessing', { orderUid, correlationId });
    return {
      isValid: true,
      isIdempotent: true,
    }
  }

  if (testOrderResult.patient_uid !== patientId ) {
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

function updateDatabase(identifiers: Identifiers, interpretationCode: InterpretationCode, orderReference: string): void {
  if (interpretationCode === InterpretationCode.Normal) {
    orderService.updateOrderStatusAndResultStatus(identifiers.orderUid, orderReference, OrderStatus.Complete, ResultStatus.Result_Available, identifiers.correlationId);
  }

  if (interpretationCode === InterpretationCode.Abnormal) {
    orderService.updateResultStatus(identifiers.orderUid, ResultStatus.Result_Withheld, identifiers.correlationId);
  }
}

/**
 * Lambda handler for POST /result endpoint
 * Accepts FHIR Observation resources and posts them to database after validation and business logic checks.
 * Returns appropriate FHIR responses for success and error cases.
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  commons.logInfo('order-result-lambda', 'Received result submission request', {
    path: event.path,
    method: event.httpMethod,
  });

  const {
    validationResult,
    observation,
    identifiers
  } = extractAndValidateObservationFields(event);

  if (!validationResult.isValid) {
    return createFhirErrorResponse(validationResult.errorCode as ErrorStatusCode, validationResult.errorType!, validationResult.errorMessage!, validationResult.severity);
  }

  const testOrderResult: OrderResultSummary | null = await orderService.retrieveOrderDetails(identifiers!.orderUid);

  if (!testOrderResult) {
    commons.logError('order-result-lambda', 'Test order not found for orderUid', { orderUid: identifiers!.orderUid });
    return createFhirErrorResponse(404, 'not-found', `No order found for orderUid ${identifiers!.orderUid}`, 'error');
  }

  const dbValidationResult = await validateDBData(
    identifiers!,
    observation!,
    testOrderResult,
  );

  if (!dbValidationResult.isValid) {
    return createFhirErrorResponse(dbValidationResult.errorCode!, dbValidationResult.errorType!, dbValidationResult.errorMessage!, dbValidationResult.severity);
  }

  if (dbValidationResult.isIdempotent) {
    return createFhirResponse(201, observation!);
  }

  const interpretationCode = extractInterpretationCodeFromFHIRObservation(observation!);

  try{
    updateDatabase(identifiers!, interpretationCode, testOrderResult.order_reference);
  } catch (error) {
    commons.logError('order-result-lambda', 'Database update failed', { error });
    return createFhirErrorResponse(500, 'exception', 'An internal error occurred', 'fatal');
  }

  return createFhirResponse(201, observation!);
};
