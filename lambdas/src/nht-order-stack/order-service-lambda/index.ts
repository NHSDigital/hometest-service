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

const commons = new Commons('order', 'order-service');

const className = 'handler';

interface OrderRequest {
  testId: string;
  patientId: string;
  deliveryAddress: {
    line1: string;
    line2?: string;
    city: string;
    postcode: string;
  };
  phoneNumber: string;
}

/**
 * Order Service Lambda
 * Handles placing new test kit orders
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

    const orderRequest: OrderRequest = JSON.parse(event.body);
    
    commons.logInfo(className, 'Placing order', { 
      testId: orderRequest.testId,
      patientId: orderRequest.patientId 
    });

    // TODO: Validate order request
    // TODO: Save order to DynamoDB
    // TODO: Send order to SQS queue for processing

    const orderId = `ORD-${Date.now()}`;

    const orderResponse = {
      orderId,
      status: 'queued',
      message: 'Order has been placed and queued for processing',
      estimatedDelivery: '3-5 business days'
    };

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderResponse)
    };
  } catch (error) {
    commons.logError(className, 'Error placing order', { error });
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
