import { test, expect } from '../../fixtures/commonFixture';
import { AuditEventType, type IHealthCheck } from '@dnhc-health-checks/shared';
import {
  getTestNotifyMessage,
  sendNotificationTestData
} from '../../testData/sendingNotificationTestData';
import type { ICommunication } from '../../lib/aws/sqs/communicationsQueueClientServce';
import {
  HealthCheckFactory,
  HealthCheckType
} from '../../testData/healthCheck/healthCheckFactory';

let notificationMessage: ICommunication;
let healthCheck: IHealthCheck;

sendNotificationTestData.forEach(
  ({ notificationMessageTemplate, expectedAuditEventMessageType }) => {
    test.describe(`Sending Notification to Notify`, () => {
      test.beforeEach(async ({ dbHealthCheckService, testedUser }) => {
        healthCheck = HealthCheckFactory.createHealthCheck(
          testedUser,
          HealthCheckType.QUESTIONNAIRE_COMPLETED
        );
        await dbHealthCheckService.createHealthCheck(healthCheck);

        notificationMessage = getTestNotifyMessage(
          notificationMessageTemplate,
          testedUser.nhsNumber,
          healthCheck.id
        );
      });

      test.afterEach(async ({ dbAuditEvent, dbHealthCheckService }) => {
        await dbHealthCheckService.deleteItemById(
          notificationMessage.healthCheckId
        );
        await dbAuditEvent.deleteItemByNhsNumber(notificationMessage.nhsNumber);
      });

      test(`Sending Notification to Notify with template ${notificationMessageTemplate}`, async ({
        communicationsQueueClientService,
        dbAuditEvent
      }) => {
        const testStartDate = new Date().toISOString();
        await test.step('Sent a message using SQS ', async () => {
          await communicationsQueueClientService.sendMessage(
            notificationMessage
          );
        });
        await test.step(`${AuditEventType.PatientResultsAvailable} Event was created as a result of communication with Notify`, async () => {
          const dbAuditEventItem =
            await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
              notificationMessage.nhsNumber,
              AuditEventType.PatientResultsAvailable,
              testStartDate
            );
          expect(
            dbAuditEventItem,
            'PatientResultsAvailable audit event was not found'
          ).toBeTruthy();
          expect
            .soft(dbAuditEventItem?.id, 'Id was not found in audit event')
            .toBeTruthy();
          expect
            .soft(
              dbAuditEventItem?.nhcVersion,
              'NhcVersion was not found in audit event'
            )
            .toBeTruthy();
          expect
            .soft(
              dbAuditEventItem?.details?.notifyMessageID,
              'NotifyMessageID was not found in audit event'
            )
            .toBeTruthy();
          expect
            .soft(
              dbAuditEventItem?.details?.messageType,
              'AuditEvent messageType is different than expected'
            )
            .toEqual(expectedAuditEventMessageType);
          expect
            .soft(
              dbAuditEventItem?.healthCheckId,
              'HealthCheckId was not found in audit event'
            )
            .toEqual(notificationMessage.healthCheckId);
          expect
            .soft(
              dbAuditEventItem?.hcDataModelVersion,
              'HcDataModelVersion was not found in audit event'
            )
            .toEqual(healthCheck.dataModelVersion);
          expect
            .soft(
              dbAuditEventItem?.eventType,
              'EventType is different than PatientResultsAvailable'
            )
            .toEqual(AuditEventType.PatientResultsAvailable);
          expect
            .soft(
              dbAuditEventItem?.nhsNumber,
              'NhsNumber was not found in audit event'
            )
            .toEqual(notificationMessage.nhsNumber);
        });
      });
    });
  }
);
