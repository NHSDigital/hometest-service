import { AuditEventType } from '@dnhc-health-checks/shared';
import { test, expect } from '../../fixtures/commonFixture';
import type { ICommunicationLogItem } from '../../lib/aws/dynamoDB/DbCommunicationLogService';
import { communicationTestData } from '../../testData/communicationTestData';
import {
  HealthCheckFactory,
  HealthCheckType
} from '../../testData/healthCheck/healthCheckFactory';

let healthCheckId: string;

communicationTestData().forEach(
  ({
    communicationLogItems,
    notificationPayload,
    expectedUpdate,
    description
  }) => {
    test.describe(`Check update communication status when callback received from Notify`, () => {
      test.beforeEach(
        async ({
          dbCommunicationLogService,
          testedUser,
          dynamoDBServiceUtils
        }) => {
          healthCheckId =
            await dynamoDBServiceUtils.cleanHealthCheckTableAndAddHealthCheckItem(
              testedUser,
              HealthCheckFactory.createHealthCheck(
                testedUser,
                HealthCheckType.INITIAL
              )
            );

          for (const communicationLogItem of communicationLogItems) {
            await dbCommunicationLogService.createCommunicationLogItem(
              communicationLogItem
            );
            await dbCommunicationLogService.updateCommunicationLogItemHealthCheckId(
              communicationLogItem.messageReference,
              healthCheckId
            );
          }
        }
      );
      test.afterEach(
        async ({
          testedUser,
          dbCommunicationLogService,
          dbHealthCheckService,
          dbAuditEvent
        }) => {
          for (const communicationLogItem of communicationLogItems) {
            await dbCommunicationLogService.deleteCommunicationLogByMessageReference(
              communicationLogItem.messageReference
            );
          }
          await dbHealthCheckService.deleteItemById(healthCheckId);
          await dbAuditEvent.deleteItemByNhsNumber(testedUser.nhsNumber);
        }
      );

      test(
        `Check update communication status when callback received from Notify - ${description}`,
        {
          tag: ['@integration', '@notify']
        },
        async ({
          testedUser,
          dbAuditEvent,
          dbCommunicationLogService,
          notifyCallbackApiResource
        }) => {
          test.slow();
          const testStartDate = new Date().toISOString();

          await test.step('Run notify request with a communicationLogItem messageReference in the payload', async () => {
            const response =
              await notifyCallbackApiResource.sendNotification(
                notificationPayload
              );
            expect(
              response.status(),
              "Post to notify endpoint should have passed, but it didn't."
            ).toEqual(202);
          });

          await test.step('Check Communication log item changes in db after request', async () => {
            await Promise.all(
              communicationLogItems.map(
                async (communicationLogItem: ICommunicationLogItem) => {
                  const communicationLogItemData =
                    await dbCommunicationLogService.getCommunicationLogItemByMessageReference(
                      communicationLogItem.messageReference
                    );
                  if (expectedUpdate) {
                    expect(
                      communicationLogItemData.messageStatus,
                      `Communication log item field 'messageStatus' was not updated correctly`
                    ).toEqual(
                      notificationPayload.data[0].attributes.messageStatus
                    );
                    expect(
                      communicationLogItemData.messageStatusDescription,
                      `Communication log item field 'messageStatusDescription' was not updated correctly`
                    ).toEqual(
                      notificationPayload.data[0].attributes
                        .messageStatusDescription
                    );
                    expect(
                      communicationLogItemData.receivedAt,
                      `Communication log item field 'receivedAt' was not added after sending request`
                    ).toBeDefined();
                    expect(
                      communicationLogItemData.channels,
                      `Communication log item field 'channels' was not added after sending request`
                    ).toEqual(notificationPayload.data[0].attributes.channels);
                  } else {
                    expect(
                      communicationLogItemData.messageStatus,
                      `Communication log item field 'messageStatus' was updated but it should not`
                    ).toEqual(communicationLogItem.messageStatus);
                  }
                }
              )
            );
          });

          await test.step('Check if Audit event was created after communication log item update', async () => {
            await Promise.all(
              communicationLogItems.map(
                async (communicationLogItem: ICommunicationLogItem) => {
                  if (expectedUpdate) {
                    const expectedMessage =
                      notificationPayload.data[0].attributes.messageStatus ===
                      'failed'
                        ? AuditEventType.NotifyMessageDeliveryFailure
                        : AuditEventType.NotifyMessageDeliverySuccess;

                    const notifyAuditEvent =
                      await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
                        testedUser.nhsNumber,
                        expectedMessage,
                        testStartDate
                      );

                    expect(
                      notifyAuditEvent?.details?.notifyMessageID,
                      'Message ID in audit event should match the one from Notify payload'
                    ).toEqual(notificationPayload.data[0].attributes.messageId);

                    expect(
                      notifyAuditEvent?.details?.messageType,
                      'Message type in Audit event should match the one from communication log item'
                    ).toEqual(communicationLogItem.type);

                    if (
                      expectedMessage ===
                      AuditEventType.NotifyMessageDeliverySuccess
                    ) {
                      expect(
                        notifyAuditEvent?.details?.channel,
                        'Channel in Audit event should match the one from Notify payload'
                      ).toEqual(
                        notificationPayload.data[0].attributes.channels[0].type
                      );
                    }
                  } else {
                    console.log(
                      'Communication log item was not updated, so no audit event should be created'
                    );
                  }
                }
              )
            );
          });
        }
      );
    });
  }
);
