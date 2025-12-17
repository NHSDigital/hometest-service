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

const commons = new Commons('result', 'result-service');

const className = 'handler';

interface ResultSubmission {
  orderId: string;
  patientId: string;
  supplierId: string;
  testType: string;
  resultData: {
    status: 'positive' | 'negative' | 'inconclusive';
    values?: Record<string, unknown>;
    testDate: string;
    reportDate: string;
  };
}

/**
 * Result Service Lambda
 * Receives test results from external suppliers
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

    const resultSubmission: ResultSubmission = JSON.parse(event.body);
    
    commons.logInfo(className, 'Receiving result from supplier', {
      orderId: resultSubmission.orderId,
      supplierId: resultSubmission.supplierId,
      testType: resultSubmission.testType
    });

    // TODO: Validate supplier authentication
    // TODO: Validate result data schema
    // TODO: Save result to DynamoDB
    // TODO: Send result to SQS queue for processing

    const resultId = `RES-${Date.now()}`;

    return {
      statusCode: 202,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resultId,
        status: 'accepted',
        message: 'Result has been received and queued for processing'
      })
    };
  } catch (error) {
    commons.logError(className, 'Error receiving result', { error });
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
