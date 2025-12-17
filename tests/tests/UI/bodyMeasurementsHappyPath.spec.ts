import { test, expect } from '../../fixtures/commonFixture';
import {
  AuditEventType,
  LeicesterRiskCategory
} from '@dnhc-health-checks/shared';
import { BodyMeasurementsSectionFlow } from '../../lib/flows/BodyMeasurementsSection/BodyMeasurementsSectionFlow';
import {
  BodyMeasurementsSectionDataFactory,
  BodyMeasurementsSectionDataType
} from '../../lib/flows/BodyMeasurementsSection/BodyMeasurementsSectionDataFactory';
import {
  HealthCheckFactory,
  HealthCheckType
} from '../../testData/healthCheck/healthCheckFactory';
import {
  AboutYouSectionDataFactory,
  AboutYouSectionDataType
} from '../../lib/flows/AboutYouSection/AboutYouSectionDataFactory';
import { AboutYouSectionFlow } from '../../lib/flows/AboutYouSection/AboutYouSectionFlow';

let healthCheckId: string;

test.beforeEach(async ({ testedUser, dynamoDBServiceUtils, dbAuditEvent }) => {
  healthCheckId =
    await dynamoDBServiceUtils.cleanHealthCheckTableAndAddHealthCheckItem(
      testedUser,
      HealthCheckFactory.createHealthCheck(
        testedUser,
        HealthCheckType.QUESTIONNAIRE_FILLED
      )
    );
  await dbAuditEvent.deleteItemByNhsNumber(testedUser.nhsNumber);
});

test.afterEach(async ({ testedUser, dbAuditEvent, dbHealthCheckService }) => {
  await dbAuditEvent.deleteItemByNhsNumber(testedUser.nhsNumber);
  await dbHealthCheckService.deleteItemById(healthCheckId);
});

test(
  'Body measurements happy path with changing answers',
  {
    tag: ['@ui', '@happyPath', '@bodyMeasurements', '@regression']
  },
  async ({
    page,
    taskListPage,
    testedUser,
    dbAuditEvent,
    dbHealthCheckService
  }) => {
    test.slow();
    const testStartDate = new Date().toISOString();

    await test.step(`Go to Body measurements section and complete it with healthy BMI data`, async () => {
      await taskListPage.goToTaskListPageAndWaitForLoading();

      const data = new BodyMeasurementsSectionDataFactory(
        BodyMeasurementsSectionDataType.HEALTHY_BMI_INCHES_POUNDS
      ).getData();
      await new BodyMeasurementsSectionFlow(
        data,
        page,
        false
      ).completeSection();
    });

    await test.step('Check if SectionStartBodyMeasurements event was created in DB', async () => {
      const sectionStartBodyMeasurementsMessage =
        await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
          testedUser.nhsNumber,
          AuditEventType.SectionStartBodyMeasurements,
          testStartDate
        );
      expect(
        sectionStartBodyMeasurementsMessage,
        'Check if SectionStartBodyMeasurements event was created'
      ).toBeTruthy();
    });

    await test.step('Check if SectionCompleteBodyMeasurements event was created in DB after completing section', async () => {
      const sectionCompleteBodyMeasurementsMessage =
        await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
          testedUser.nhsNumber,
          AuditEventType.SectionCompleteBodyMeasurements,
          testStartDate
        );
      expect(
        sectionCompleteBodyMeasurementsMessage,
        'Check if SectionCompleteBodyMeasurements event was created'
      ).toBeTruthy();
    });

    await test.step('Check if HbA1cResultNotRequired event was created in DB', async () => {
      const hbA1cResultNotRequiredMessage =
        await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
          testedUser.nhsNumber,
          AuditEventType.HbA1cResultNotRequired,
          testStartDate
        );
      expect(
        hbA1cResultNotRequiredMessage,
        'Check if HbA1cResultNotRequired event was created'
      ).toBeTruthy();
    });

    await test.step('Check if Body Measurement section status is still Completed after changes in AboutYou', async () => {
      const aboutYouData = new AboutYouSectionDataFactory(
        AboutYouSectionDataType.HIGH_RISK_ASIAN_MALE
      ).getData();

      await new AboutYouSectionFlow(
        aboutYouData,
        page,
        false
      ).completeSection();

      await expect(
        taskListPage.enterBodyMeasurementsStatus,
        'Check if BodyMeasurement status is still Completed'
      ).toHaveText('Completed');
    });

    await test.step(`Go to Body measurements section and change it with unhealthy BMI data`, async () => {
      const data = new BodyMeasurementsSectionDataFactory(
        BodyMeasurementsSectionDataType.UNHEALTHY_BMI
      ).getData();
      await new BodyMeasurementsSectionFlow(
        data,
        page,
        false
      ).completeSection();
    });

    await test.step(`Check if leicesterRiskCategory was changed to High`, async () => {
      const healthCheck =
        await dbHealthCheckService.getHealthCheckItemById(healthCheckId);
      expect(
        healthCheck.questionnaireScores?.leicesterRiskCategory,
        'Check if leicesterRiskCategory score is Very High'
      ).toBe(LeicesterRiskCategory.VeryHigh);
    });

    await test.step('Check if HbA1cResultRequired event was created in DB', async () => {
      const hbA1cResultRequiredMessage =
        await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
          testedUser.nhsNumber,
          AuditEventType.HbA1cResultRequired,
          testStartDate
        );
      expect(
        hbA1cResultRequiredMessage,
        'Check if HbA1cResultRequired event was created'
      ).toBeTruthy();
    });
  }
);
