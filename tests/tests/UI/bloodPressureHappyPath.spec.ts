import { test, expect } from '../../fixtures/commonFixture';
import { ConfirmBloodPressureValueOptions } from '../../page-objects/BloodPressurePages/ConfirmBloodPressureReadingsPage';
import { LowBloodPressureSymptomOptions } from '../../page-objects/BloodPressurePages/LowBloodPressureSymptomsPage';
import { AuditEventType, type IHealthCheck } from '@dnhc-health-checks/shared';
import { BloodPressureLocation } from '../../lib/enum/health-check-answers';
import {
  HealthCheckFactory,
  HealthCheckType
} from '../../testData/healthCheck/healthCheckFactory';

let dbItem: IHealthCheck;
let healthCheckId: string;

const bloodPressureValuesBeforeChange = {
  bloodPressureOption: BloodPressureLocation.Monitor,
  systolic: 90,
  diastolic: 80,
  hasStrongLowBloodPressureSymptoms: false,
  category: 'Healthy'
};
const bloodPressureValuesAfterChange = {
  bloodPressureOption: BloodPressureLocation.Pharmacy,
  systolic: 179,
  diastolic: 119,
  category: 'High'
};

const LowBloodPressureValues = {
  bloodPressureOption: BloodPressureLocation.Monitor,
  systolic: 80,
  diastolic: 50,
  hasStrongLowBloodPressureSymptoms: true,
  category: 'Low'
};

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

test.afterEach(async ({ dbGpUpdateSchedulerService }) => {
  await dbGpUpdateSchedulerService.deleteGpUpdateSchedulerItemByHealthCheckId(
    healthCheckId
  );
});

test(
  'Blood pressure happy path with changing values',
  {
    tag: ['@ui', '@bloodPressure', '@regression', '@happyPath']
  },
  async ({
    taskListPage,
    bloodPressurePages,
    testedUser,
    dbAuditEvent,
    dbHealthCheckService,
    dynamoDBServiceUtils
  }) => {
    const testStartDate = new Date().toISOString();
    await test.step('Go to Check Your Blood Pressure section and check if SectionStartBloodPressure event was created', async () => {
      await taskListPage.goToTaskListPageAndWaitForLoading();
      await taskListPage.clickCheckYourPressureLink();
      await bloodPressurePages.checkBloodPressurePage.waitUntilLoaded();

      const event = await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
        testedUser.nhsNumber,
        AuditEventType.SectionStartBloodPressure,
        testStartDate
      );
      expect(event).toBeTruthy();
    });

    await test.step('Enter Blood Pressure values and check it on checkYourAnswers Page', async () => {
      await bloodPressurePages.checkBloodPressurePage.clickContinueButton();
      await bloodPressurePages.confirmBloodPressureLocationPage.selectBloodPressureOptionsAndClickContinue(
        bloodPressureValuesBeforeChange.bloodPressureOption
      );

      await bloodPressurePages.enterYourReadingPage.waitUntilLoaded();
      expect(
        await bloodPressurePages.enterYourReadingPage.iNeedHelpMeasuringInfo.isVisible()
      ).toBeTruthy();

      await bloodPressurePages.enterYourReadingPage.fillSystolicAndDiastolicValuesAndClickContinue(
        bloodPressureValuesBeforeChange.systolic,
        bloodPressureValuesBeforeChange.diastolic
      );

      expect(
        await bloodPressurePages.checkYourAnswersPage.getSystolicDiastolicValues()
      ).toContain(`${bloodPressureValuesBeforeChange.systolic} Systolic`);
      expect(
        await bloodPressurePages.checkYourAnswersPage.getSystolicDiastolicValues()
      ).toContain(`${bloodPressureValuesBeforeChange.diastolic} Diastolic`);
    });

    await test.step('Check data in the database', async () => {
      healthCheckId = await dbHealthCheckService.getIdByNhsNumber(
        testedUser.nhsNumber
      );
      dbItem = await dbHealthCheckService.getHealthCheckItemById(healthCheckId);
      expect(dbItem.questionnaire?.bloodPressureSystolic).toEqual(
        bloodPressureValuesBeforeChange.systolic
      );
      expect(dbItem.questionnaire?.bloodPressureDiastolic).toEqual(
        bloodPressureValuesBeforeChange.diastolic
      );
      expect(dbItem.questionnaire?.bloodPressureLocation).toEqual(
        bloodPressureValuesBeforeChange.bloodPressureOption
      );
      expect(dbItem.questionnaireScores?.bloodPressureCategory).toEqual(
        bloodPressureValuesBeforeChange.category
      );
    });

    await test.step('Enter low Blood Pressure values, select low blood pressure symptoms and check it on checkYourAnswers Page and audit event', async () => {
      const testStartDate = new Date().toISOString();
      await bloodPressurePages.checkYourAnswersPage.clickChangeSystolicAndDiastolicLink();
      await bloodPressurePages.enterYourReadingPage.waitUntilLoaded();

      await bloodPressurePages.enterYourReadingPage.fillSystolicAndDiastolicValuesAndClickContinue(
        LowBloodPressureValues.systolic,
        LowBloodPressureValues.diastolic
      );
      await bloodPressurePages.confirmBloodPressureReadingsPage.waitUntilLoaded();
      expect(
        await bloodPressurePages.confirmBloodPressureReadingsPage.getPageHeaderText()
      ).toContain(
        'You told us your blood pressure reading is 80/50. Is this correct?'
      );
      await bloodPressurePages.confirmBloodPressureReadingsPage.selectConfirmBloodPressureValueOptionsAndClickContinue(
        ConfirmBloodPressureValueOptions.Yes
      );

      await bloodPressurePages.lowBloodPressureSymptomsPage.waitUntilLoaded();
      await bloodPressurePages.lowBloodPressureSymptomsPage.selectLowBloodPressureSymptomOptionsAndClickContinue(
        LowBloodPressureSymptomOptions.Yes
      );

      const lastMessageBpEntered =
        await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
          testedUser.nhsNumber,
          AuditEventType.BloodPressureEntered,
          testStartDate
        );
      expect(lastMessageBpEntered).toBeTruthy();

      const lastMessageBpConfirmed =
        await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
          testedUser.nhsNumber,
          AuditEventType.BloodPressureConfirmation,
          testStartDate
        );
      expect(lastMessageBpConfirmed).toBeTruthy();
      const auditEventMessage =
        await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
          testedUser.nhsNumber,
          AuditEventType.UrgentLowBloodPressure,
          testStartDate
        );

      await bloodPressurePages.lowBloodPressureShutterPage.waitUntilLoaded();
      expect(auditEventMessage).toBeTruthy();
    });

    await test.step('Check data in the database for low blood pressure values', async () => {
      dbItem = await dbHealthCheckService.getHealthCheckItemById(healthCheckId);
      expect(dbItem.questionnaire?.bloodPressureSystolic).toEqual(
        LowBloodPressureValues.systolic
      );
      expect(dbItem.questionnaire?.bloodPressureDiastolic).toEqual(
        LowBloodPressureValues.diastolic
      );
      expect(dbItem.questionnaire?.bloodPressureLocation).toEqual(
        LowBloodPressureValues.bloodPressureOption
      );
      expect(dbItem.questionnaire?.hasStrongLowBloodPressureSymptoms).toEqual(
        LowBloodPressureValues.hasStrongLowBloodPressureSymptoms
      );
      expect(dbItem.questionnaireScores?.bloodPressureCategory).toEqual(
        LowBloodPressureValues.category
      );
    });

    await test.step('Select low Blood Pressure symptom and check it on checkYourAnswers Page when selected no for low blood pressure symptom', async () => {
      await test.step('Reset low blood pressure shutter page state', async () => {
        await dynamoDBServiceUtils.updateHealthCheckQuestionnaire(
          healthCheckId,
          {
            hasStrongLowBloodPressureSymptoms: false
          }
        );
      });

      await bloodPressurePages.lowBloodPressureSymptomsPage.goToLowBloodPressureSymptomsPage();
      await bloodPressurePages.lowBloodPressureSymptomsPage.waitUntilLoaded();
      await bloodPressurePages.lowBloodPressureSymptomsPage.selectLowBloodPressureSymptomOptionsAndClickContinue(
        LowBloodPressureSymptomOptions.No
      );
      expect(
        await bloodPressurePages.checkYourAnswersPage.getLowBloodPressureSymptomsValues()
      ).toContain('No, I do not');
    });

    await test.step('Click Change link, enter new Blood Pressure values and check it on checkYourAnswers Page', async () => {
      await bloodPressurePages.checkYourAnswersPage.clickChangeReadingBloodPressureLink();
      await bloodPressurePages.confirmBloodPressureLocationPage.selectBloodPressureOptionsAndClickContinue(
        bloodPressureValuesAfterChange.bloodPressureOption
      );
      expect(
        await bloodPressurePages.enterYourReadingPage.iNeedHelpMeasuringInfo.isVisible()
      ).toBeFalsy();

      await bloodPressurePages.enterYourReadingPage.fillSystolicAndDiastolicValuesAndClickContinue(
        bloodPressureValuesAfterChange.systolic,
        bloodPressureValuesAfterChange.diastolic
      );
      expect(
        await bloodPressurePages.checkYourAnswersPage.getSystolicDiastolicValues()
      ).toContain(`${bloodPressureValuesAfterChange.systolic} Systolic`);
      expect(
        await bloodPressurePages.checkYourAnswersPage.getSystolicDiastolicValues()
      ).toContain(`${bloodPressureValuesAfterChange.diastolic} Diastolic`);
    });

    await test.step('Click SaveAndContinue Button and wait for redirection to the Task List Page', async () => {
      await bloodPressurePages.checkYourAnswersPage.clickSaveAndContinueButton();
      await taskListPage.waitUntilLoaded();
    });

    await test.step('Check data in the database after changes', async () => {
      dbItem = await dbHealthCheckService.getHealthCheckItemById(healthCheckId);
      expect(dbItem.questionnaire?.bloodPressureSystolic).toEqual(
        bloodPressureValuesAfterChange.systolic
      );
      expect(dbItem.questionnaire?.bloodPressureDiastolic).toEqual(
        bloodPressureValuesAfterChange.diastolic
      );
      expect(dbItem.questionnaire?.bloodPressureLocation).toEqual(
        bloodPressureValuesAfterChange.bloodPressureOption
      );
      expect(dbItem.questionnaireScores?.bloodPressureCategory).toEqual(
        bloodPressureValuesAfterChange.category
      );
    });

    await test.step('Check if SectionCompleteBloodPressure event was created in DB after completing section', async () => {
      const event = await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
        testedUser.nhsNumber,
        AuditEventType.SectionCompleteBloodPressure,
        testStartDate
      );
      expect(event).toBeTruthy();
    });
  }
);

test(
  'Check if audit event PharmacySearchOpened was created after click "Find a pharmacy" Link',
  {
    tag: ['@ui', '@bloodPressure', '@regression', '@happyPath']
  },
  async ({ taskListPage, bloodPressurePages, testedUser, dbAuditEvent }) => {
    const testStartDate = new Date().toISOString();
    await taskListPage.goToTaskListPageAndWaitForLoading();

    await taskListPage.clickCheckYourPressureLink();
    await bloodPressurePages.checkBloodPressurePage.clickFindPharmacyLink();

    const lastMessage = await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
      testedUser.nhsNumber,
      AuditEventType.PharmacySearchOpened,
      testStartDate
    );
    expect(lastMessage).toBeTruthy();
  }
);
