import { test, expect } from '../../../fixtures/commonFixture';
import {
  type DeadLetterMessageItem,
  DeadLetterMessageStatus
} from '../../../lib/aws/dynamoDB/DbDeadLetterMessages';
import { v4 as uuidv4 } from 'uuid';

const retriesLimit = 14;

let dlMessageItem: DeadLetterMessageItem;
let dlMessageItemDb: DeadLetterMessageItem;

export default function dlqReplayAndRedriveRetryLimitTest(): void {
  [
    { queueName: 'NhcGpUpdateScheduler.fifo', maxRetriesReached: true },
    { queueName: 'NhcLabOrderQueue', maxRetriesReached: true },
    { queueName: 'NhcLabOrderQueue', maxRetriesReached: false }
  ].forEach(({ queueName, maxRetriesReached }) => {
    test.describe('Integration tests of DLQ replay mechanism and retries limit', () => {
      test.beforeAll(
        'Creating dead letter message item in Db',
        async ({ dbDeadLetterMessagesService, config }) => {
          await dbDeadLetterMessagesService.deleteAllDeadLetterMessageItems();
          dlMessageItem = {
            id: uuidv4(),
            addToDbTime: '2025-01-30T10:00:18.562Z',
            maxAutoRetriesReached: maxRetriesReached,
            messageBody: '{"message":"test retries limit"}',
            messageCreationTime: '2025-01-30T09:58:48.082Z',
            messageId: uuidv4(),
            originalMessageId: uuidv4(),
            queueName: `${config.name}${queueName}`,
            retries: retriesLimit,
            status: DeadLetterMessageStatus.New
          };

          await dbDeadLetterMessagesService.createDeadLetterMessageItem(
            dlMessageItem
          );
        }
      );

      test.afterAll(
        'Deleting created DealLetterMessage from db',
        async ({ dbDeadLetterMessagesService }) => {
          await dbDeadLetterMessagesService.deleteDeadLetterMessageItemById(
            dlMessageItem.id
          );
        }
      );

      test(
        `Integration test for processing DLQ messages from ${queueName} SQS, max retries counter limit reached set to ${maxRetriesReached}`,
        {
          tag: ['@dlq', '@integration']
        },
        async ({ lambdaService, dbDeadLetterMessagesService, config }) => {
          await test.step('Run NhcRedriveDlqMessagesLambda for a multiple messages', async () => {
            const response = await lambdaService.runLambdaWithParameters(
              `${config.name}NhcRedriveDlqMessagesLambda`,
              {
                redriveAll: true,
                source: 'aws.events'
              }
            );
            expect(response.$metadata.httpStatusCode).toEqual(200);
          });

          await test.step('Check if message status was not changed to Redriven, when retry limit was reached', async () => {
            dlMessageItemDb =
              await dbDeadLetterMessagesService.getDeadLetterMessageItemById(
                dlMessageItem.id
              );
            console.log(JSON.stringify(dlMessageItemDb));
            expect(dlMessageItemDb?.status).toEqual(
              DeadLetterMessageStatus.New
            );
            expect(dlMessageItemDb?.deleteTime).toBeUndefined();
            expect(dlMessageItemDb?.retries).toEqual(retriesLimit);
            expect(dlMessageItemDb?.maxAutoRetriesReached).toEqual(true);
          });
        }
      );
    });
  });
}
