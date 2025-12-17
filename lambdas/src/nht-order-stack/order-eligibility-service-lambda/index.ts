import {
  type APIGatewayProxyEvent,
  type APIGatewayProxyResult
} from 'aws-lambda';
import middy from '@middy/core';
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';
import { logMetrics } from '@aws-lambda-powertools/metrics/middleware';
import { Commons } from '../../lib/commons';
import {
  LambdaEventType,
  sharedHandlerMiddleware
} from '../../lib/shared-handler-middleware';

const commons = new Commons('order', 'order-eligibility-service');

const className = 'handler';

interface EligibilityRequest {
  patientId: string;
  testId: string;
}

interface EligibilityResponse {
  eligible: boolean;
  reason?: string;
  stockAvailable: boolean;
}

/**
 * Order Eligibility Service Lambda
 * Checks if a patient is eligible to order a test and stock availability
 */
const lambdaHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Request body is required' })
      };
    }

    const request: EligibilityRequest = JSON.parse(event.body);
    
    commons.logInfo(className, 'Checking eligibility', {
      patientId: request.patientId,
      testId: request.testId
    });

    // TODO: Check patient eligibility from DynamoDB
    // TODO: Check stock availability from supplier API

    const response: EligibilityResponse = {
      eligible: true,
      stockAvailable: true
    };

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(response)
    };
  } catch (error) {
    commons.logError(className, 'Error checking eligibility', { error });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

export const handler = middy(lambdaHandler)
  .use(injectLambdaContext(commons.logger))
  .use(captureLambdaHandler(commons.tracer))
  .use(logMetrics(commons.metrics))
  .use(sharedHandlerMiddleware(LambdaEventType.API_GATEWAY));
