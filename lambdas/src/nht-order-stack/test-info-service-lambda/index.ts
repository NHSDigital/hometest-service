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

const commons = new Commons('order', 'test-info-service');

const className = 'handler';

/**
 * Test Info Service Lambda
 * Provides information about available home tests
 */
const lambdaHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    commons.logInfo(className, 'Getting test info');

    // TODO: Implement test info retrieval from DynamoDB
    const testInfo = {
      tests: [
        {
          id: 'home-test-001',
          name: 'Home Blood Test Kit',
          description: 'Self-collection blood test kit for home use',
          available: true
        }
      ]
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testInfo)
    };
  } catch (error) {
    commons.logError(className, 'Error getting test info', { error });
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

export const handler = middy(lambdaHandler)
  .use(injectLambdaContext(commons.logger))
  .use(captureLambdaHandler(commons.tracer))
  .use(logMetrics(commons.metrics))
  .use(sharedHandlerMiddleware(LambdaEventType.API_GATEWAY));
