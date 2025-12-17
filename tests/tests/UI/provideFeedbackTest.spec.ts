import { HealthCheckSteps } from '@dnhc-health-checks/shared';
import { test, expect } from '../../fixtures/commonFixture';
import {
  EligibilitySectionDataFactory,
  EligibilitySectionDataType
} from '../../lib/flows/EligibilitySection/EligibilitySectionDataFactory';
import { EligibilitySectionFlow } from '../../lib/flows/EligibilitySection/EligibilitySectionFlow';
import {
  HealthCheckFactory,
  HealthCheckType
} from '../../testData/healthCheck/healthCheckFactory';

let testStartDate: string;
let healthCheckId: string;

test.beforeEach(async ({ testedUser, dynamoDBServiceUtils }) => {
  healthCheckId =
    await dynamoDBServiceUtils.cleanHealthCheckTableAndAddHealthCheckItem(
      testedUser,
      HealthCheckFactory.createHealthCheck(testedUser, HealthCheckType.INITIAL)
    );

  testStartDate = new Date().toISOString();
});

test.afterEach(async ({ testedUser, dbAuditEvent }) => {
  await dbAuditEvent.deleteItemByNhsNumber(testedUser.nhsNumber);
});

test(
  'Test ability to give feedback on Eligibility shutter screen and if UserFeedbackSurveyOpened event was logged',
  {
    tag: ['@ui', '@regression']
  },
  async ({ nhsLoginPages, page, testedUser, dbAuditEvent }) => {
    await test.step('Test ability to give feedback on Eligibility shutter screen', async () => {
      await nhsLoginPages.nhsFirstPage.goToTheQuestionnaireAppURL();
      const data = new EligibilitySectionDataFactory(
        EligibilitySectionDataType.NOT_ELIGIBLE_TESTED_LESS_THAN_5_YEARS_USER
      ).getData();
      await new EligibilitySectionFlow(data, page).completeSection();
    });

    await test.step('Test if UserFeedbackSurveyOpened event was logged', async () => {
      const lastMessage =
        await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
          testedUser.nhsNumber,
          'UserFeedbackSurveyOpened',
          testStartDate
        );
      expect(lastMessage).toBeTruthy();
    });
  }
);

test(
  'Test ability to give feedback on Pre-existing health conditions shutter and if UserFeedbackSurveyOpened event was logged',
  {
    tag: ['@ui', '@regression']
  },
  async ({
    nhsLoginPages,
    eligibilityPages,
    testedUser,
    dbAuditEvent,
    page
  }) => {
    await test.step('Pre-existing health conditions shutter', async () => {
      await nhsLoginPages.nhsFirstPage.goToTheQuestionnaireAppURL();

      const data = new EligibilitySectionDataFactory(
        EligibilitySectionDataType.NOT_ELIGIBLE_PRE_CONDITIONS_USER
      ).getData();
      await new EligibilitySectionFlow(data, page).completeSection();

      await expect(
        eligibilityPages.preExistingHealthConditionsNotEligiblePage
          .expectedFeedbackSubtitle
      ).toBeVisible();
    });

    await test.step('Test if UserFeedbackSurveyOpened event was logged', async () => {
      const lastMessage =
        await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
          testedUser.nhsNumber,
          'UserFeedbackSurveyOpened',
          testStartDate
        );
      expect(lastMessage).toBeTruthy();
    });
  }
);

test(
  'Test ability to give feedback on Extended exclusions shutter page and if UserFeedbackSurveyOpened event was logged',
  {
    tag: ['@ui', '@regression']
  },
  async ({
    nhsLoginPages,
    eligibilityPages,
    testedUser,
    dbAuditEvent,
    page
  }) => {
    await test.step('Extended exclusions shutter page', async () => {
      await nhsLoginPages.nhsFirstPage.goToTheQuestionnaireAppURL();

      const data = new EligibilitySectionDataFactory(
        EligibilitySectionDataType.NOT_ELIGIBLE_CANNOT_CONTINUE_ONLINE_USER
      ).getData();
      await new EligibilitySectionFlow(data, page).completeSection();

      await expect(
        eligibilityPages.contactYourGPSurgeryAboutYourNHSHealthCheckPage
          .expectedFeedbackSubtitle
      ).toBeVisible();
    });

    await test.step('Test if UserFeedbackSurveyOpened event was logged', async () => {
      const lastMessage =
        await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
          testedUser.nhsNumber,
          'UserFeedbackSurveyOpened',
          testStartDate
        );
      expect(lastMessage).toBeTruthy();
    });
  }
);

test(
  'Data expired shutter screen and Test if UserFeedbackSurveyOpened event was logged',
  {
    tag: ['@ui', '@regression']
  },
  async ({
    taskListPage,
    healthCheckExpiredPage,
    testedUser,
    dbHealthCheckService,
    dbAuditEvent,
    config
  }) => {
    test.skip(
      config.autoExpiryEnabled !== true,
      'Only runs on environments with auto expiry enabled, set autoExpiryEnabled in test config and ENABLE_AUTO_EXPIRY in env config'
    );
    await test.step('Data expired shutter screen', async () => {
      await dbHealthCheckService.updateHealthCheckStep(
        healthCheckId,
        HealthCheckSteps.AUTO_EXPIRED
      );
      await taskListPage.goToTaskListPage();
      await healthCheckExpiredPage.waitUntilLoaded();
      await expect(
        healthCheckExpiredPage.expectedFeedbackSubtitle
      ).toBeVisible();
      await healthCheckExpiredPage.clickFeedbackButton();
    });

    await test.step('Test if UserFeedbackSurveyOpened event was logged', async () => {
      const lastMessage =
        await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
          testedUser.nhsNumber,
          'UserFeedbackSurveyOpened',
          testStartDate
        );
      expect(lastMessage).toBeTruthy();
    });
  }
);

test.describe(`Provide feedback on Blood pressure shutter screen`, () => {
  test.beforeEach(async ({ testedUser, dynamoDBServiceUtils }) => {
    healthCheckId =
      await dynamoDBServiceUtils.cleanHealthCheckTableAndAddHealthCheckItem(
        testedUser,
        HealthCheckFactory.createHealthCheck(
          testedUser,
          HealthCheckType.QUESTIONNAIRE_FILLED
        )
      );

    testStartDate = new Date().toISOString();
  });

  test.afterEach(async ({ testedUser, dbAuditEvent }) => {
    await dbAuditEvent.deleteItemByNhsNumber(testedUser.nhsNumber);
  });

  test(
    'Test ability to give feedback on Blood pressure shutter screen and if UserFeedbackSurveyOpened event was logged',
    {
      tag: ['@ui', '@regression']
    },
    async ({ bloodPressurePages, testedUser, taskListPage, dbAuditEvent }) => {
      await test.step('Test ability to give feedback on Blood pressure shutter screen ', async () => {
        await taskListPage.goToTaskListPageAndWaitForLoading();
        await taskListPage.clickCheckYourPressureLink();
        await bloodPressurePages.checkBloodPressurePage.waitUntilLoaded();
        await bloodPressurePages.checkBloodPressurePage.clickICannotTakeBloodPressureLink();
        await expect(
          bloodPressurePages.checkBloodPressurePage.expectedFeedbackSubtitle
        ).toBeVisible();
        await bloodPressurePages.checkBloodPressurePage.clickFeedbackButton();
      });

      await test.step('Test if UserFeedbackSurveyOpened event was logged', async () => {
        const lastMessage =
          await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
            testedUser.nhsNumber,
            'UserFeedbackSurveyOpened',
            testStartDate
          );
        expect(lastMessage).toBeTruthy();
      });
    }
  );
});
