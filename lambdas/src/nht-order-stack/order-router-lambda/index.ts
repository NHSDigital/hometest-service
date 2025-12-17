import {
  type SQSBatchItemFailure,
  type SQSEvent,
  type SQSRecord
} from 'aws-lambda';
import middy from '@middy/core';
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';
import { Commons } from '../../lib/commons';
import {
  LambdaEventType,
  sharedHandlerMiddleware
} from '../../lib/shared-handler-middleware';

const commons = new Commons('order', 'order-router');

const className = 'handler';

interface OrderMessage {
  orderId: string;
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
 * Order Router Lambda
 * Processes orders from SQS queue and routes to appropriate supplier
 */
const lambdaHandler = async (event: SQSEvent): Promise<{ batchItemFailures: SQSBatchItemFailure[] }> => {
  const batchItemFailures: SQSBatchItemFailure[] = [];

  await Promise.allSettled(
    event.Records.map(async (record: SQSRecord) => {
      try {
        const orderMessage: OrderMessage = JSON.parse(record.body);
        
        commons.logInfo(className, 'Processing order from queue', {
          orderId: orderMessage.orderId,
          testId: orderMessage.testId
        });

        // TODO: Get routing information from Routing Service
        // TODO: Send order to appropriate test supplier
        // TODO: Update order status in DynamoDB

        commons.logInfo(className, 'Order processed successfully', {
          orderId: orderMessage.orderId
        });
      } catch (error) {
        commons.logError(className, 'Error processing order', {
          error,
          messageId: record.messageId
        });
        batchItemFailures.push({ itemIdentifier: record.messageId });
      }
    })
  );

  return { batchItemFailures };
};

export const handler = middy(lambdaHandler)
  .use(injectLambdaContext(commons.logger))
  .use(captureLambdaHandler(commons.tracer))
  .use(sharedHandlerMiddleware(LambdaEventType.SQS));
