import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Observation } from 'fhir/r4';
import { z } from 'zod';
import { createFhirErrorResponse, createFhirResponse } from '../lib/fhir-response';
import { isUUID } from 'src/lib/utils';
import { init } from './init';
import { OrderResultSummary } from '../lib/db/order-db';
import { FHIRObservationSchema, FHIRReferenceSchema, FHIRCodeableConceptSchema } from 'src/lib/models/fhir/fhir-schemas';
import {getCorrelationIdFromEventHeaders} from "../lib/utils";

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

const RESULT_AVAILABLE = 'RESULT_AVAILABLE';
const RESULT_WITHHELD = 'RESULT_WITHHELD';

const resultCodeMapping: { [key: string]: string } = {
  'N': RESULT_AVAILABLE,
  'A': RESULT_WITHHELD,
};

interface Identifiers {
  orderUid: string;
  patientId: string;
  supplierId: string;
  correlationId: string;
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

function extractInterpretationCodeFromFHIRObservation(observation: Observation): string {
  return observation.interpretation![0].coding![0].code!;
}

function extractAndValidateObservationFields(event: APIGatewayProxyEvent): { validateObservationErrorResponse: APIGatewayProxyResult | null, observation?: Observation, identifiers?: Identifiers } {
  try {
    validateBody(event.body);
  } catch (error) {
    return { validateObservationErrorResponse: createFhirErrorResponse(400, 'invalid', (error as Error).message, 'error')};
  }

  const observation: Observation = JSON.parse(event.body!);
  let correlationId: string;

  try {
    correlationId = getCorrelationIdFromEventHeaders(event);
  } catch (error) {
    commons.logError('order-result-lambda', 'Header validation failed', { error: (error as Error).message });
    return { validateObservationErrorResponse: createFhirErrorResponse(400, 'invalid', (error as Error).message, 'error') };
  }

  let orderUid: string, patientId: string, supplierId: string;

  try {
    orderUid = extractOrderUidFromFHIRObservation(observation);
    patientId = extractPatientIdFromFHIRObservation(observation);
    supplierId = extractSupplierIdFromFHIRObservation(observation);
  } catch (error) {
    commons.logError('order-result-lambda', 'Error extracting identifiers from Observation', { error });
    return { validateObservationErrorResponse: createFhirErrorResponse(400, 'invalid', 'Unable to extract necessary identifiers from Observation', 'error') };
  }

  const identifiers: Identifiers = {
    orderUid,
    patientId,
    supplierId,
    correlationId
  };

  return {
    validateObservationErrorResponse: null,
    observation,
    identifiers,
  };
}

async function validateDBData(
  identifiers: Identifiers,
  observation: Observation,
  testOrderResult: OrderResultSummary,
): Promise<APIGatewayProxyResult | null> {

  const interpretationCode = extractInterpretationCodeFromFHIRObservation(observation);
  const { orderUid, patientId, supplierId, correlationId } = identifiers;

  if (!testOrderResult) {
    commons.logError('order-result-lambda', 'Test order not found for orderUid', { orderUid });
    return createFhirErrorResponse(404, 'not-found', `No order found for orderUid ${orderUid}`, 'error');
  }

  // Idempotency check
  if (testOrderResult.correlation_id && testOrderResult.correlation_id === correlationId) { //TODO: double check if the itempotency check logic is correct
    if (resultCodeMapping[interpretationCode] !== testOrderResult.result_status) {
      commons.logError('order-result-lambda', 'Idempotency check failed, different result detected on same correlation ID.', { orderUid, correlationId });
      return createFhirErrorResponse(409, 'conflict', 'A different result has already been submitted for this order with the same correlation ID', 'error');
    }

    commons.logInfo('order-result-lambda', 'Duplicate submission with same correlation ID detected, returning success without reprocessing', { orderUid, correlationId });
    return createFhirResponse(201, observation);
  }

  if (testOrderResult.patient_uid !== patientId ) {
    commons.logError('order-result-lambda', 'Patient ID in Observation does not match test order record', { orderUid, patientId });
    return createFhirErrorResponse(400, 'invalid', 'Patient ID in Observation does not match order', 'error');
  }

  if (testOrderResult.supplier_id !== supplierId) {
    commons.logError('order-result-lambda', 'Supplier ID in Observation does not match test order record', { orderUid, supplierId });
    return createFhirErrorResponse(403, 'forbidden', 'Supplier not authorized for this order', 'error');
  }

  return null;
}

function updateDatabase(identifiers: Identifiers, interpretationCode: string): void {
  if (interpretationCode === 'N') {
    // Update DB: order_status to 'COMPLETE', result_status to 'RESULT_AVAILABLE'
    orderService.updateOrderStatusAndResultStatus(identifiers.orderUid, 'COMPLETE', RESULT_AVAILABLE, identifiers.correlationId);
  }

  if (interpretationCode === 'A') {
    // Update DB: result_status to 'RESULT_WITHHELD'
    orderService.updateResultStatus(identifiers.orderUid, RESULT_WITHHELD, identifiers.correlationId);
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
    validateObservationErrorResponse,
    observation,
    identifiers
  } = extractAndValidateObservationFields(event);

  if (validateObservationErrorResponse) {
    return validateObservationErrorResponse;
  }

  // get test_order via orderUid, if not found return 404
  const testOrderResult: OrderResultSummary | null = await orderService.retrieveOrderDetails(identifiers!.orderUid);

  if (!testOrderResult) {
    commons.logError('order-result-lambda', 'Test order not found for orderUid', { orderUid: identifiers!.orderUid });
    return createFhirErrorResponse(404, 'not-found', `No order found for orderUid ${identifiers!.orderUid}`, 'error');
  }

  const dbValidationErrorResponse = await validateDBData(
    identifiers!,
    observation!,
    testOrderResult,
  );

  if (dbValidationErrorResponse) {
    return dbValidationErrorResponse;
  }

  const interpretationCode = extractInterpretationCodeFromFHIRObservation(observation!);

  try{
    updateDatabase(identifiers!, interpretationCode);
  } catch (error) {
    commons.logError('order-result-lambda', 'Database update failed', { error });
    return createFhirErrorResponse(500, 'exception', 'An internal error occurred', 'fatal');
  }

  return createFhirResponse(201, observation!);
};
