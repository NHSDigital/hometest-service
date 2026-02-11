import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Observation, Parameters } from 'fhir/r4';
import { z } from 'zod';
import { AWSSQSClient } from '../lib/sqs/sqs-client';
import { createFhirErrorResponse, createFhirResponse } from '../lib/fhir-response';
import { ConsoleCommons } from '../lib/commons';

const sqsClient = new AWSSQSClient();
const commons = new ConsoleCommons();
const QUEUE_URL = process.env.RESULT_QUEUE_URL || '';

// Zod schema for validating FHIR Observation fields that we care about
const observationSchema = z.looseObject({
  basedOn: z.array(z.looseObject({
    reference: z.string(),
  })),
  subject: z.strictObject({
    reference: z.string(),
  }),
  valueCodeableConcept: z.strictObject({
    coding: z.array(z.strictObject({
      system: z.string(),
      code: z.string(),
      display: z.string(),
    })),
    text: z.optional(z.string()),
  }),
});

/**
 * Lambda handler for POST /result endpoint
 * Accepts FHIR Observation resources and posts them to SQS queue
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  commons.logInfo('order-result-lambda', 'Received result submission request', {
    path: event.path,
    method: event.httpMethod,
  });

  let observation: Observation;

  try {
    if (event.body === '{}' || event.body === null) {
      throw new Error('Empty body');
    }
    observation = JSON.parse(event.body);
  } catch (error) {
    commons.logError('order-result-lambda', 'Invalid JSON in request body', { error });
    return createFhirErrorResponse(400, 'invalid', 'Invalid JSON in request body', 'error');
  }

  const validationResult = observationSchema.safeParse(observation);

  if (!validationResult.success) {
    let errorDetails: string = z.prettifyError(validationResult.error);
    // clean up error output to remove unnesesary decoration
    errorDetails = errorDetails.replace(/(?:\u2716 |\r?\n )/g, '');

    commons.logError('order-result-lambda', 'Validation failed', { error: errorDetails});
    return createFhirErrorResponse(400, 'invalid', errorDetails, 'error');
  }

  try{
    const orderUid = extractOrderUid(observation);
    const correlationId = event.headers['X-Correlation-ID'];
    const messageBody = JSON.stringify({
      observation,
      correlationId,
      receivedAt: new Date().toISOString(),
    });

    await sqsClient.sendMessage(QUEUE_URL, messageBody, {
      CorrelationId: {
        DataType: 'String',
        StringValue: correlationId || '',
      },
      OrderUid: {
        DataType: 'String',
        StringValue: orderUid || '',
      },
    });

    commons.logInfo('order-result-lambda', 'Result posted to SQS', { orderUid, correlationId });

    return createFhirResponse(201, observation);

  } catch (error) {
    commons.logError('order-result-lambda', 'Error processing result submission', { error });
    return createFhirErrorResponse(500, 'exception', 'An internal error occurred', 'fatal');
  }

};

function extractOrderUid(observation: Observation): string | null {
  if (observation.basedOn?.length === 0) {
    return null;
  }

  const reference = observation.basedOn?.[0]?.reference;

  if (!reference) {
    return null;
  }

  // Extract UUID from reference like "ServiceRequest/550e8400-e29b-41d4-a716-446655440000"
  const parts = reference.split('/');
  return parts.length == 2 ? parts[1] : null;
}
