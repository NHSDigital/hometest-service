import { test, expect } from '../../../fixtures/commonFixture';
import { type Config, ConfigFactory } from '../../../env/config';
import {
  type DeadLetterMessageItem,
  DeadLetterMessageStatus
} from '../../../lib/aws/dynamoDB/DbDeadLetterMessages';
import { getNhcCollectDlqMessagesLambdaPayload } from '../../../testData/dlqReplayPayloadData';
import { v4 as uuidv4 } from 'uuid';
import { SqsClientService } from '../../../lib/aws/sqs/sqsClient';

const config: Config = ConfigFactory.getConfig();
const gpUpdateSchedulerQueueName: string = 'NhcGpUpdateScheduler.fifo';
const updatePatientRecordQueueName: string = 'NhcUpdatePatientRecord.fifo';
const labOrderQueueQueueName: string = 'NhcLabOrderQueue';
const expectedGpUpdateSchedulerQueueName: string = `${config.name}${gpUpdateSchedulerQueueName}`;
const expectedUpdatePatientRecordQueueName: string = `${config.name}${updatePatientRecordQueueName}`;
const nowTimestamp = Date.now();
let messageIdList: Array<{
  messageId: string;
  queueName: string;
  isFifo: boolean;
}>;
let dlMessageItem: DeadLetterMessageItem | undefined;

export default function dlqReplayAndRedriveMultipleMessagesTest(): void {
  test.describe('Integration tests of DLQ redrive mechanism for multiple messages', () => {
    test.beforeEach(
      'Create messages in DB using NhcCollectDlqMessagesLambda',
      async ({ dbDeadLetterMessagesService, lambdaService, config }) => {
        await dbDeadLetterMessagesService.deleteAllDeadLetterMessageItems();
        messageIdList = [
          {
            messageId: uuidv4(),
            queueName: gpUpdateSchedulerQueueName,
            isFifo: true
          },
          {
            messageId: uuidv4(),
            queueName: gpUpdateSchedulerQueueName,
            isFifo: true
          },
          {
            messageId: uuidv4(),
            queueName: updatePatientRecordQueueName,
            isFifo: true
          },
          {
            messageId: uuidv4(),
            queueName: labOrderQueueQueueName,
            isFifo: false
          }
        ];

        await Promise.all(
          messageIdList.map(async (message) => {
            const response = await lambdaService.runLambdaWithParameters(
              `${config.name}NhcCollectDlqMessagesLambda`,
              getNhcCollectDlqMessagesLambdaPayload(
                { message: message.messageId },
                message.messageId,
                nowTimestamp.toString(),
                await new SqsClientService(
                  config.name,
                  message.queueName
                ).getQueueArn(message.queueName)
              )
            );
            expect(response.$metadata.httpStatusCode).toEqual(200);
          })
        );
      }
    );

    test.afterAll(
      'Deleting created DealLetterMessage from db',
      async ({ dbDeadLetterMessagesService }) => {
        await dbDeadLetterMessagesService.deleteDeadLetterMessageItemsByQueueName(
          expectedGpUpdateSchedulerQueueName
        );
        await dbDeadLetterMessagesService.deleteDeadLetterMessageItemsByQueueName(
          expectedUpdatePatientRecordQueueName
        );
      }
    );

    test(
      'Integration test for redrive multiple DLQ messages for single queue',
      {
        tag: ['@dlq', '@integration']
      },
      async ({ dbDeadLetterMessagesService, lambdaService, config }) => {
        test.slow();

        await test.step('Check if a new dead letter messages items were created in DB', async () => {
          await Promise.all(
            messageIdList.map(async (message) => {
              dlMessageItem =
                await dbDeadLetterMessagesService.waitForDeadLetterMessage(
                  message.messageId,
                  `${config.name}${message.queueName}`
                );

              expect(dlMessageItem?.status).toEqual(
                DeadLetterMessageStatus.New
              );
              expect(dlMessageItem?.queueName).toEqual(
                `${config.name}${message.queueName}`
              );
            })
          );
        });

        await test.step(`Run NhcRedriveDlqMessagesLambda for a single queue - ${expectedGpUpdateSchedulerQueueName}`, async () => {
          const response = await lambdaService.runLambdaWithParameters(
            `${config.name}NhcRedriveDlqMessagesLambda`,
            {
              queue: `${expectedGpUpdateSchedulerQueueName}`
            }
          );
          expect(response.$metadata.httpStatusCode).toEqual(200);
        });

        await test.step(`Check if message status was changed to Redriven only for ${expectedGpUpdateSchedulerQueueName}`, async () => {
          await Promise.all(
            messageIdList.map(async (message) => {
              dlMessageItem =
                await dbDeadLetterMessagesService.waitForDeadLetterMessage(
                  message.messageId,
                  `${config.name}${message.queueName}`
                );

              if (
                dlMessageItem?.queueName === expectedGpUpdateSchedulerQueueName
              ) {
                expect(dlMessageItem?.status).toEqual(
                  DeadLetterMessageStatus.Redriven
                );
                expect(dlMessageItem?.deleteTime).not.toBeUndefined();
              } else {
                expect(dlMessageItem?.status).toEqual(
                  DeadLetterMessageStatus.New
                );
                expect(dlMessageItem?.deleteTime).toBeUndefined();
              }
            })
          );
        });
      }
    );

    test(
      'Integration test for redrive all DLQ messages in DB',
      {
        tag: ['@dlq', '@integration']
      },
      async ({ dbDeadLetterMessagesService, lambdaService, config }) => {
        test.slow();

        await test.step('Check if a new dead letter messages items were created in DB', async () => {
          await Promise.all(
            messageIdList.map(async (message) => {
              dlMessageItem =
                await dbDeadLetterMessagesService.waitForDeadLetterMessage(
                  message.messageId,
                  `${config.name}${message.queueName}`
                );

              expect(dlMessageItem?.status).toEqual(
                DeadLetterMessageStatus.New
              );
              expect(dlMessageItem?.queueName).toEqual(
                `${config.name}${message.queueName}`
              );
            })
          );
        });

        await test.step(`Run NhcRedriveDlqMessagesLambda for all messages in DB`, async () => {
          const response = await lambdaService.runLambdaWithParameters(
            `${config.name}NhcRedriveDlqMessagesLambda`,
            {
              redriveAll: true
            }
          );
          expect(response.$metadata.httpStatusCode).toEqual(200);
        });

        await test.step(`Check if message status was changed to Redriven for all messages`, async () => {
          await Promise.all(
            messageIdList.map(async (message) => {
              dlMessageItem =
                await dbDeadLetterMessagesService.waitForDeadLetterMessage(
                  message.messageId,
                  `${config.name}${message.queueName}`
                );

              expect(dlMessageItem?.status).toEqual(
                DeadLetterMessageStatus.Redriven
              );
              expect(dlMessageItem?.deleteTime).not.toBeUndefined();
            })
          );
        });
      }
    );
  });
}
