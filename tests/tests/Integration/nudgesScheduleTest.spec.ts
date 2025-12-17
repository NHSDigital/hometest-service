import { test, expect } from '../../fixtures/commonFixture';
import { ConfigFactory, type Config } from '../../env/config';
import {
  AuditEventType,
  HeightDisplayPreference,
  AutoExpiryStatus,
  HealthCheckSteps,
  NotificationTemplate,
  WaistMeasurementDisplayPreference,
  WeightDisplayPreference,
  ParentSiblingHeartAttack
} from '@dnhc-health-checks/shared';
import { HealthCheckBuilder } from '../../testData/healthCheck/healthCheckBuilder';

const config: Config = ConfigFactory.getConfig();
let healthCheckID: string;

let healthCheckShutteredHighBpId: string;
let expiredHealthCheckId: string;
let healthCheckShutteredDiabetesId: string;

test.describe('Integration test for nudges scheduling', () => {
  test.skip(
    config.integratedEnvironment === true,
    'Only runs on PoC environments, on Test and Int is temporarily disabled'
  );
  test.beforeEach(
    async ({ testedUser, dbAuditEvent, dynamoDBServiceUtils }) => {
      const healthCheckToCreate = new HealthCheckBuilder(testedUser)
        .withCreatedAt(
          new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
        )
        .withQuestionnaire({
          canCompleteHealthCheckOnline: true,
          hasCompletedHealthCheckInLast5Years: null,
          hasHealthSymptoms: null,
          hasPreExistingCondition: null,
          hasReceivedAnInvitation: true,
          height: 180,
          heightDisplayPreference: HeightDisplayPreference.Centimetres,
          isBodyMeasurementsSectionSubmitted: true,
          waistMeasurement: 80,
          waistMeasurementDisplayPreference:
            WaistMeasurementDisplayPreference.Centimetres,
          weight: 77,
          weightDisplayPreference: WeightDisplayPreference.Kilograms
        })
        .withQuestionnaireScores({})
        .build();

      healthCheckID = healthCheckToCreate.id;
      await dynamoDBServiceUtils.cleanHealthCheckTableAndAddHealthCheckItem(
        testedUser,
        healthCheckToCreate
      );
      await dbAuditEvent.deleteItemByNhsNumber(testedUser.nhsNumber);
    }
  );

  test.afterEach(
    'Cleaning up test data',
    async ({
      testedUser,
      dbHealthCheckService,
      dbCommunicationLogService,
      dbAuditEvent
    }) => {
      await dbHealthCheckService.deleteItemById(healthCheckID);
      await dbCommunicationLogService.deleteAllCommunicationLogByHealthCheckId(
        healthCheckID
      );
      await dbAuditEvent.deleteItemByNhsNumber(testedUser.nhsNumber);
    }
  );

  test(
    'Check if nudges are scheduled correctly, 5 full days after a user starts a health check but has not completed the questionnaire',
    {
      tag: ['@nudges', '@integration']
    },
    async ({
      testedUser,
      nhcIdentifyNudgesLambdaService,
      dbCommunicationLogService,
      dbAuditEvent,
      dbHealthCheckService
    }) => {
      const testStartDate = new Date().toISOString();

      await test.step('Run NhcIdentifyNudgesLambda for executing the nudge service', async () => {
        const response = await nhcIdentifyNudgesLambdaService.triggerLambda();
        expect(response.$metadata.httpStatusCode).toEqual(200);
      });

      await test.step('Check if the nudge communication log item was created in DB', async () => {
        const communicationLogItem =
          await dbCommunicationLogService.waitForCommunicationItemsByHealthCheckId(
            healthCheckID
          );

        expect(
          communicationLogItem?.type,
          'Communication log item type is different than expected'
        ).toEqual('NudgeInitialAfterStart');
      });

      await test.step('Check if the audit event was created with the message type NudgeInitialAfterStart', async () => {
        const auditEventItem =
          await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
            testedUser.nhsNumber,
            AuditEventType.NudgeSentQuestionnaire,
            testStartDate
          );

        expect(
          auditEventItem?.details?.messageType,
          'Audit Event message type is different than expected'
        ).toEqual('NudgeInitialAfterStart');
        expect(
          auditEventItem?.details?.notifyMessageID,
          'NotifyMessageID was not found in Audit Event details'
        ).toBeDefined();
        expect(
          auditEventItem?.details?.journeySectionsComplete,
          'journeySectionsComplete does not contain eligibility section'
        ).toContain('eligibility');
        expect(
          auditEventItem?.details?.journeySectionsComplete,
          'journeySectionsComplete does not contain body measurements section'
        ).toContain('bodyMeasurements');
      });

      await test.step('Check if nudge information was added in the healthCheck', async () => {
        const healthCheck =
          await dbHealthCheckService.getHealthCheckItemById(healthCheckID);

        expect(
          healthCheck.nudges?.[0].type,
          'Audit Event message type is different than expected'
        ).toEqual(NotificationTemplate.NUDGE_INITIAL_AFTER_START);
      });

      await test.step('Run NhcIdentifyNudgesLambda second time', async () => {
        const response = await nhcIdentifyNudgesLambdaService.triggerLambda();
        expect(response.$metadata.httpStatusCode).toEqual(200);
      });

      await test.step('Check if no new communication logs were created', async () => {
        const communicationLogItems =
          await dbCommunicationLogService.getCommunicationLogByHealthCheckId(
            healthCheckID
          );

        expect(
          communicationLogItems.length,
          'New communication log item was created, while it should not'
        ).toEqual(1);
      });
    }
  );
});

test.describe('Exclude shuttered users from receiving nudges test', () => {
  test.skip(
    config.integratedEnvironment === true,
    'Only runs on PoC environments, on Test and Int is temporarily disabled'
  );
  test.beforeEach(
    async ({
      testedUser,
      dbAuditEvent,
      dynamoDBServiceUtils,
      dbHealthCheckService
    }) => {
      const healthCheckShutteredHighBP = new HealthCheckBuilder(testedUser)
        .withCreatedAt(
          new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
        )
        .withQuestionnaire({
          canCompleteHealthCheckOnline: true,
          hasCompletedHealthCheckInLast5Years: false,
          hasFamilyHeartAttackHistory: ParentSiblingHeartAttack.Unknown,
          hasHealthSymptoms: null,
          hasPreExistingCondition: false,
          isAboutYouSectionSubmitted: false,
          postcode: 'E18RD',
          highBloodPressureValuesConfirmed: true
        })
        .withQuestionnaireScores({})
        .build();

      const healthCheckShutteredDiabetes = new HealthCheckBuilder(testedUser)
        .withCreatedAt(
          new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
        )
        .withQuestionnaire({
          canCompleteHealthCheckOnline: true,
          hasCompletedHealthCheckInLast5Years: false,
          hasFamilyHeartAttackHistory: ParentSiblingHeartAttack.Unknown,
          hasHealthSymptoms: true,
          hasPreExistingCondition: false,
          isAboutYouSectionSubmitted: false,
          postcode: 'E18RD'
        })
        .withQuestionnaireScores({ leicesterRiskScore: 20 })
        .build();

      const expiredHealthCheck = new HealthCheckBuilder(testedUser)
        .withCreatedAt(
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        )
        .withExpiryStatus(AutoExpiryStatus.COMPLETE)
        .withStep(HealthCheckSteps.AUTO_EXPIRED)
        .withQuestionnaire({})
        .withQuestionnaireScores({})
        .build();

      healthCheckShutteredHighBpId = healthCheckShutteredHighBP.id;
      expiredHealthCheckId = expiredHealthCheck.id;
      healthCheckShutteredDiabetesId =
        await dynamoDBServiceUtils.cleanHealthCheckTableAndAddHealthCheckItem(
          testedUser,
          healthCheckShutteredHighBP
        );
      await dbHealthCheckService.createHealthCheck(expiredHealthCheck);
      await dbHealthCheckService.createHealthCheck(
        healthCheckShutteredDiabetes
      );
      await dbAuditEvent.deleteItemByNhsNumber(testedUser.nhsNumber);
    }
  );

  test.afterEach(
    'Cleaning up test data',
    async ({
      testedUser,
      dbHealthCheckService,
      dbCommunicationLogService,
      dbAuditEvent
    }) => {
      await Promise.all(
        [
          expiredHealthCheckId,
          healthCheckShutteredHighBpId,
          healthCheckShutteredDiabetesId
        ].map(async (healthCheckId: string) => {
          await dbHealthCheckService.deleteItemById(healthCheckId);
          await dbCommunicationLogService.deleteAllCommunicationLogByHealthCheckId(
            healthCheckId
          );
        })
      );

      await dbAuditEvent.deleteItemByNhsNumber(testedUser.nhsNumber);
    }
  );

  test(
    'Check if shuttered users are not receiving nudge messages',
    {
      tag: ['@nudges', '@integration']
    },
    async ({ nhcIdentifyNudgesLambdaService, nudgeCloudWatchService }) => {
      const startTime = new Date().setDate(new Date().getDate());

      await test.step('Run NhcIdentifyNudgesLambda for executing the nudge service', async () => {
        const response = await nhcIdentifyNudgesLambdaService.triggerLambda();
        expect(response.$metadata.httpStatusCode).toEqual(200);
      });

      await test.step('Check if there are no messages about sending a nudge in the CloudWatch logs', async () => {
        const logs = await nudgeCloudWatchService.waitForMessageInNudgeLog(
          startTime,
          'No health checks meeting criteria for a nudge found'
        );
        expect(
          logs.length,
          `Nudge was incorrectly send for shuttered user`
        ).toBeGreaterThan(0);
      });
    }
  );
});
