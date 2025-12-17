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

const commons = new Commons('order', 'routing-service');

const className = 'handler';

interface RoutingRequest {
  testId: string;
  region?: string;
}

interface RoutingResponse {
  supplierId: string;
  supplierName: string;
  apiEndpoint: string;
  priority: number;
}

/**
 * Routing Service Lambda
 * Determines which supplier should fulfill an order based on test type and region
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

    const request: RoutingRequest = JSON.parse(event.body);
    
    commons.logInfo(className, 'Getting routing info', {
      testId: request.testId,
      region: request.region
    });

    // TODO: Get routing configuration from S3/DynamoDB
    // TODO: Check supplier availability and capacity

    const response: RoutingResponse = {
      supplierId: 'supplier-001',
      supplierName: 'Default Test Supplier',
      apiEndpoint: 'https://api.testsupplier.com/v1',
      priority: 1
    };

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(response)
    };
  } catch (error) {
    commons.logError(className, 'Error getting routing info', { error });
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
