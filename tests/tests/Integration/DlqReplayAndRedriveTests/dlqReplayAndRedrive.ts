import { test, expect } from '../../../fixtures/commonFixture';
import {
  type DeadLetterMessageItem,
  DeadLetterMessageStatus
} from '../../../lib/aws/dynamoDB/DbDeadLetterMessages';
import { SqsClientService } from '../../../lib/aws/sqs/sqsClient';
import { getNhcCollectDlqMessagesLambdaPayload } from '../../../testData/dlqReplayPayloadData';
import { v4 as uuidv4 } from 'uuid';

const messageBody = { prop: 'value' };
const nowTimestamp = Date.now();

let messageId: string;
let queueArn: string;
let dlMessageItem: DeadLetterMessageItem | undefined;
let expectedQueueName: string;

export default function dlqReplayAndRedriveTest(): void {
  [
    { queueName: 'NhcGpUpdateScheduler.fifo', isFifo: true },
    { queueName: 'NhcLabOrderQueue', isFifo: false }
  ].forEach(({ queueName, isFifo }) => {
    test.describe('Integration tests of DLQ replay mechanism', () => {
      test.beforeAll(
        'Fetching queue ARN',
        async ({ dbDeadLetterMessagesService, config }) => {
          await dbDeadLetterMessagesService.deleteAllDeadLetterMessageItems();
          messageId = uuidv4();
          queueArn = await new SqsClientService(
            config.name,
            queueName
          ).getQueueArn(queueName);
          expectedQueueName = `${config.name}${queueName}`;
        }
      );

      test.afterAll(
        'Deleting created DealLetterMessage from db',
        async ({ dbDeadLetterMessagesService }) => {
          if (dlMessageItem) {
            await dbDeadLetterMessagesService.deleteDeadLetterMessageItemById(
              dlMessageItem.id
            );
          }
        }
      );

      test(
        `Integration test for processing DLQ messages for queue - ${queueName}`,
        {
          tag: ['@dlq', '@integration']
        },
        async ({ lambdaService, dbDeadLetterMessagesService, config }) => {
          test.slow();
          const response = await lambdaService.runLambdaWithParameters(
            `${config.name}NhcCollectDlqMessagesLambda`,
            getNhcCollectDlqMessagesLambdaPayload(
              messageBody,
              messageId,
              nowTimestamp.toString(),
              queueArn,
              isFifo
            )
          );
          expect(response.$metadata.httpStatusCode).toEqual(200);

          await test.step('Check if a new dead letter message item was created in DB', async () => {
            dlMessageItem =
              await dbDeadLetterMessagesService.waitForDeadLetterMessage(
                messageId,
                expectedQueueName
              );

            expect(dlMessageItem).not.toBeUndefined();
            if (dlMessageItem) {
              expect(dlMessageItem.queueName).toEqual(expectedQueueName);
              expect(dlMessageItem.messageBody).toEqual(
                JSON.stringify(messageBody)
              );
              expect(dlMessageItem.status).toEqual(DeadLetterMessageStatus.New);
              expect(dlMessageItem.messageCreationTime).toEqual(
                new Date(nowTimestamp).toISOString()
              );
              expect(
                new Date(dlMessageItem.addToDbTime) > new Date(nowTimestamp)
              ).toBeTruthy();
              expect(dlMessageItem.deleteTime).toBeUndefined();
            }
          });

          await test.step('Run NhcRedriveDlqMessagesLambda for a single message', async () => {
            const response = await lambdaService.runLambdaWithParameters(
              `${config.name}NhcRedriveDlqMessagesLambda`,
              {
                dynamoRecordId: `${dlMessageItem?.id}`
              }
            );
            expect(response.$metadata.httpStatusCode).toEqual(200);
          });

          await test.step('Check if message status was changed to Redriven', async () => {
            dlMessageItem =
              await dbDeadLetterMessagesService.waitForDeadLetterMessage(
                messageId,
                expectedQueueName
              );
            expect(dlMessageItem?.status).toEqual(
              DeadLetterMessageStatus.Redriven
            );
            expect(dlMessageItem?.deleteTime).not.toBeUndefined();
          });
        }
      );
    });
  });
}
