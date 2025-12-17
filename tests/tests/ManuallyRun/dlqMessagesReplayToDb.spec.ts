import { test, expect } from '../../fixtures/commonFixture';
import { type Config, ConfigFactory } from '../../env/config';
import {
  type DeadLetterMessageItem,
  DeadLetterMessageStatus
} from '../../lib/aws/dynamoDB/DbDeadLetterMessages';

import { v4 as uuidv4 } from 'uuid';

const config: Config = ConfigFactory.getConfig();
const expectedQueueName: string = `${config.name}NhcLabOrderQueue`;
const messageBody = { healthCheckId: uuidv4() };

let dlMessageItem: DeadLetterMessageItem | undefined;

test.describe(
  'Integration tests of DLQ replay mechanism',
  {
    tag: ['@manual']
  },
  () => {
    test.beforeAll(
      'Breaking up lambda by changing the env variable to the incorrect one',
      async ({ lambdaService, dbDeadLetterMessagesService, config }) => {
        await dbDeadLetterMessagesService.deleteDeadLetterMessageItemsByQueueName(
          expectedQueueName
        );
        await lambdaService.updateLambdaVariable(
          `${config.name}NhcLabOrderPlacementLambda`,
          'ENV_NAME',
          `${config.name}_`
        );
      }
    );

    test.afterAll(
      'Deleting created DealLetterMessage from db and fixing lambda',
      async ({ dbDeadLetterMessagesService, lambdaService, config }) => {
        await dbDeadLetterMessagesService.deleteDeadLetterMessageItemById(
          dlMessageItem?.id as unknown as string
        );
        await lambdaService.updateLambdaVariable(
          `${config.name}NhcLabOrderPlacementLambda`,
          'ENV_NAME',
          `${config.name}`
        );
      }
    );

    test(
      'Integration test for processing DLQ messages into Db table',
      {
        tag: ['@dlq', '@integration']
      },
      async ({ dbDeadLetterMessagesService, labOrderSQSService }) => {
        test.setTimeout(200_000);
        const testStartDate = new Date().toISOString();
        await labOrderSQSService.sendMessage(messageBody);

        await test.step('Check if a new dead letter message item was created in DB', async () => {
          dlMessageItem =
            await dbDeadLetterMessagesService.waitForDeadLetterMessageByQueueName(
              expectedQueueName,
              testStartDate
            );

          expect(dlMessageItem?.queueName).toEqual(expectedQueueName);
          expect(dlMessageItem?.status).toEqual(DeadLetterMessageStatus.New);
          expect(dlMessageItem?.messageBody).toEqual(
            JSON.stringify(messageBody)
          );
        });
      }
    );
  }
);
