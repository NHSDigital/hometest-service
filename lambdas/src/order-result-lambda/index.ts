import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Observation, Parameters } from 'fhir/r4'; //TODO: confirm version (R5, R4B, R4, R3, R2)
import { z } from 'zod';
import { AWSSQSClient } from '../lib/sqs/sqs-client';
import { createFhirErrorResponse, createFhirResponse } from '../lib/fhir-response';
import { ConsoleCommons } from '../lib/commons';

const sqsClient = new AWSSQSClient();
const commons = new ConsoleCommons();
const QUEUE_URL = process.env.RESULT_QUEUE_URL || '';

// Zod schema for validating required FHIR Observation fields
// TODO: verify schema
const observationSchema = z.looseObject({
  basedOn: z.array(z.strictObject({
    reference: z.string(),
  })),
  subject: z.strictObject({
    reference: z.string(),
  }),
  interpretation: z.array(z.strictObject({
    coding: z.array(z.strictObject({
      system: z.string(),
      code: z.string(),
      display: z.string(),
    })),
    text: z.optional(z.string()),
  })),
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

  // Parse the FHIR Observation from request body
  let observation: Observation;
  try {
    observation = JSON.parse(event.body || '{}');

  } catch (error) {
    commons.logError('order-result-lambda', 'Invalid JSON in request body', { error });
    return createFhirErrorResponse(400, 'invalid', 'Invalid JSON in request body', 'error');
  }

  // Validate required fields
  const validationResult = observationSchema.safeParse(observation);

  if (!validationResult.success) {
    commons.logError('order-result-lambda', 'Validation failed', { error: z.prettifyError(validationResult.error) });
    return createFhirErrorResponse(400, 'invalid', z.prettifyError(validationResult.error), 'error');
  }

  try{
    // Extract order UID from basedOn reference
    const orderUid = extractOrderUid(observation);
    // Get correlation ID from header
    const correlationId = event.headers['X-Correlation-ID'];
    // Send message to SQS queue
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
    // Return 201 response as FHIR Parameters resource
    const timestamp = new Date().toISOString();
    const responseResource: Parameters = {
      resourceType: 'Parameters',
      parameter: [
        {
          name: 'order_uid',
          valueString: orderUid || '',
        },
        {
          name: 'result_status',
          valueString: 'RECEIVED',
        },
        {
          name: 'timestamp',
          valueDateTime: timestamp,
        },
      ],
    };
    return createFhirResponse(201, responseResource);

  } catch (error) {
    commons.logError('order-result-lambda', 'Error processing result submission', { error });
    return createFhirErrorResponse(500, 'exception', 'An internal error occurred', 'fatal');
  }

};

function extractOrderUid(observation: Observation): string | null {
  if (!observation.basedOn || observation.basedOn.length === 0) {
    return null;
  }

  const reference = observation.basedOn[0].reference;
  if (!reference) {
    return null;
  }

  // Extract UUID from reference like "ServiceRequest/550e8400-e29b-41d4-a716-446655440000"
  const parts = reference.split('/');
  return parts.length > 1 ? parts[1] : null;
}
