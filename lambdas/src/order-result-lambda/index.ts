import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { createFhirErrorResponse, createFhirResponse, ErrorStatusCode } from '../lib/fhir-response';
import { init } from './init';
import { OrderResultSummary } from '../lib/db/order-db';
import { FHIRObservationSchema, FHIRReferenceSchema, FHIRCodeableConceptSchema } from '../lib/models/fhir/fhir-schemas';
import { OrderStatus, ResultStatus } from '../lib/types/status';
import { extractAndValidateObservationFields, extractInterpretationCodeFromFHIRObservation, validateDBData } from './validation';

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

export const orderResultFHIRObservationSchema = FHIRObservationSchema.extend({
  basedOn: z.array(FHIRReferenceSchema),
  status: z.literal('final'),
  subject: FHIRReferenceSchema,
  performer: z.array(FHIRReferenceSchema),
  valueCodeableConcept: FHIRCodeableConceptSchema,
  interpretation: z.array(orderResultInterpretationCodingSchema),
})

export enum InterpretationCode {
  Normal = 'N',
  Abnormal = 'A',
}

export const resultCodeMapping: { [key in InterpretationCode ]: string } = {
  [InterpretationCode.Normal]: ResultStatus.Result_Available,
  [InterpretationCode.Abnormal]: ResultStatus.Result_Withheld,
};

export interface Identifiers {
  orderUid: string;
  patientId: string;
  supplierId: string;
  correlationId: string;
}

async function updateDatabase(identifiers: Identifiers, interpretationCode: InterpretationCode, orderReference: string): Promise<void> {
  if (interpretationCode === InterpretationCode.Normal) {
    await orderService.updateOrderStatusAndResultStatus(identifiers.orderUid, orderReference, OrderStatus.Complete, ResultStatus.Result_Available, identifiers.correlationId);
  }

  if (interpretationCode === InterpretationCode.Abnormal) {
    await orderService.updateOrderStatusAndResultStatus(identifiers.orderUid, orderReference, OrderStatus.Received, ResultStatus.Result_Withheld, identifiers.correlationId);
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
  } = extractAndValidateObservationFields(event, commons);

  if (!validationResult.isValid) {
    return createFhirErrorResponse(validationResult.errorCode as ErrorStatusCode, validationResult.errorType!, validationResult.errorMessage!, validationResult.severity);
  }

  let testOrderResult: OrderResultSummary | null;

  try{
    testOrderResult = await orderService.retrieveOrderDetails(identifiers!.orderUid);
  } catch (error) {
    commons.logError('order-result-lambda', 'Failed to retrieve order details', { error, orderUid: identifiers!.orderUid });
    return createFhirErrorResponse(500, 'exception', 'An internal error occurred', 'fatal');
  }

  if (!testOrderResult) {
    commons.logError('order-result-lambda', 'Test order not found for orderUid', { orderUid: identifiers!.orderUid });
    return createFhirErrorResponse(404, 'not-found', `No order found for orderUid ${identifiers!.orderUid}`, 'error');
  }

  const dbValidationResult = await validateDBData(
    identifiers!,
    observation!,
    testOrderResult,
    commons
  );

  if (!dbValidationResult.isValid) {
    return createFhirErrorResponse(dbValidationResult.errorCode!, dbValidationResult.errorType!, dbValidationResult.errorMessage!, dbValidationResult.severity);
  }

  if (dbValidationResult.isIdempotent) {
    return createFhirResponse(201, observation!);
  }

  const interpretationCode = extractInterpretationCodeFromFHIRObservation(observation!);

  try{
    await updateDatabase(identifiers!, interpretationCode, testOrderResult.order_reference);
  } catch (error) {
    commons.logError('order-result-lambda', 'Database update failed', { error });
    return createFhirErrorResponse(500, 'exception', 'An internal error occurred', 'fatal');
  }

  return createFhirResponse(201, observation!);
};
