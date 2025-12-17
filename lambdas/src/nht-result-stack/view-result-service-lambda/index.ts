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

const commons = new Commons('result', 'view-result-service');

const className = 'handler';

interface ResultResponse {
  resultId: string;
  orderId: string;
  testType: string;
  status: 'positive' | 'negative' | 'inconclusive' | 'pending';
  resultData?: {
    values?: Record<string, unknown>;
    testDate: string;
    reportDate: string;
  };
}

/**
 * View Result Service Lambda
 * Allows users to view their test results
 */
const lambdaHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const resultId = event.pathParameters?.resultId;
    const patientId = event.requestContext?.authorizer?.patientId;
    
    if (!resultId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Result ID is required' })
      };
    }

    commons.logInfo(className, 'Fetching result', {
      resultId,
      patientId
    });

    // TODO: Fetch result from DynamoDB
    // TODO: Optionally fetch detailed result from supplier API
    // TODO: Verify patient authorization

    const response: ResultResponse = {
      resultId,
      orderId: 'ORD-12345',
      testType: 'blood-test',
      status: 'negative',
      resultData: {
        values: {},
        testDate: new Date().toISOString(),
        reportDate: new Date().toISOString()
      }
    };

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(response)
    };
  } catch (error) {
    commons.logError(className, 'Error fetching result', { error });
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
