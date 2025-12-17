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

const commons = new Commons('order', 'order-event-service');

const className = 'handler';

/**
 * Order Event Service Lambda
 * Handles order tracking and status updates
 */
const lambdaHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const orderId = event.pathParameters?.orderId;
    
    if (!orderId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Order ID is required' })
      };
    }

    commons.logInfo(className, 'Tracking order', { orderId });

    // TODO: Implement order tracking from DynamoDB
    const orderStatus = {
      orderId,
      status: 'processing',
      events: [
        { timestamp: new Date().toISOString(), event: 'Order received' },
        { timestamp: new Date().toISOString(), event: 'Processing started' }
      ]
    };

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderStatus)
    };
  } catch (error) {
    commons.logError(className, 'Error tracking order', { error });
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
