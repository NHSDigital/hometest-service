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

const commons = new Commons('result', 'result-router');

const className = 'handler';

interface ResultMessage {
  resultId: string;
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
 * Result Router Lambda
 * Processes results from SQS queue, saves to database, and triggers notifications
 */
const lambdaHandler = async (event: SQSEvent): Promise<{ batchItemFailures: SQSBatchItemFailure[] }> => {
  const batchItemFailures: SQSBatchItemFailure[] = [];

  await Promise.allSettled(
    event.Records.map(async (record: SQSRecord) => {
      try {
        const resultMessage: ResultMessage = JSON.parse(record.body);
        
        commons.logInfo(className, 'Processing result from queue', {
          resultId: resultMessage.resultId,
          orderId: resultMessage.orderId,
          patientId: resultMessage.patientId
        });

        // TODO: Save result status to DynamoDB
        // TODO: Update order status in DynamoDB
        // TODO: Trigger notification service

        commons.logInfo(className, 'Result processed successfully', {
          resultId: resultMessage.resultId
        });
      } catch (error) {
        commons.logError(className, 'Error processing result', {
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
