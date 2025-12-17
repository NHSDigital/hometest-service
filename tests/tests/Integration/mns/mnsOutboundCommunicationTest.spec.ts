import { describe } from 'node:test';
import { expect, test } from '../../../fixtures/commonFixture';
import {
  HealthCheckFactory,
  HealthCheckType
} from '../../../testData/healthCheck/healthCheckFactory';
import {
  MnsDnhcEventType,
  MnsMessageStatus,
  type IMnsOutboundQueueMessage
} from '@dnhc-health-checks/shared';
import { randomUUID } from 'crypto';

describe('MNS Outbound Communication Test', () => {
  let healthCheckId: string;
  test.beforeEach(async ({ testedUser, dbHealthCheckService }) => {
    const healthCheck = HealthCheckFactory.createHealthCheck(
      testedUser,
      HealthCheckType.GP_UPDATE_SUCCESS
    );
    await dbHealthCheckService.createHealthCheck(healthCheck);
    healthCheckId = healthCheck.id;
  });

  test.afterEach(
    async ({ dbHealthCheckService, dbMnsCommunicationLogService }) => {
      await dbHealthCheckService.deleteItemById(healthCheckId);
      await dbMnsCommunicationLogService.deleteItemsByHealthCheckId(
        healthCheckId
      );
    }
  );

  test('should send MNS outbound communication successfully', async ({
    testedUser,
    mnsOutboundQueueSQSService,
    dbMnsCommunicationLogService,
    config
  }) => {
    test.skip(!config.mnsIntegrationEnabled);

    await test.step('Create MNS outbound queue message', async () => {
      const mnsOutboundQueueMessage: IMnsOutboundQueueMessage = {
        patientId: testedUser.patientId ?? '',
        healthCheckId: healthCheckId,
        pdmResourceId: `Composition/${randomUUID()}`,
        nhsNumber: testedUser.nhsNumber,
        gpOdsCode: testedUser.odsCode ?? 'mock_enabled_code',
        mnsNotificationType: MnsDnhcEventType.HC_COMPLETE_EVENT
      };

      await mnsOutboundQueueSQSService.sendMessage(mnsOutboundQueueMessage);
    });

    await test.step('Verify MNS outbound communication log in DB', async () => {
      const mnsMessageLog =
        await dbMnsCommunicationLogService.waitForItemByHealthCheckId(
          healthCheckId
        );
      expect(
        mnsMessageLog.nhsNumber,
        'MNS message NHS number does not match'
      ).toBe(testedUser.nhsNumber);
      expect(mnsMessageLog.status, 'MNS message status is not SENT').toBe(
        MnsMessageStatus.SENT
      );
    });
  });
});
