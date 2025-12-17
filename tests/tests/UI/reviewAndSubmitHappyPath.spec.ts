import { test, expect } from '../../fixtures/commonFixture';
import { GardeningOptions } from '../../page-objects/PhysicalActivityPages/HoursGardeningPage';
import { AuditEventType } from '@dnhc-health-checks/shared';
import { PhysicalActivityEventsFrequency } from '../../lib/enum/health-check-answers';
import { JourneyStepNames } from '../../route-paths';
import {
  HealthCheckFactory,
  HealthCheckType
} from '../../testData/healthCheck/healthCheckFactory';

let healthCheckId: string;

test.beforeEach(async ({ testedUser, dynamoDBServiceUtils }) => {
  healthCheckId =
    await dynamoDBServiceUtils.cleanHealthCheckTableAndAddHealthCheckItem(
      testedUser,
      HealthCheckFactory.createHealthCheck(
        testedUser,
        HealthCheckType.QUESTIONNAIRE_FILLED
      )
    );
});

test(
  'Submit and review happy path with changing values',
  {
    tag: ['@ui', '@regression']
  },
  async ({
    taskListPage,
    physicalActivityPages,
    submitAndReviewPages,
    bodyMeasurementPages,
    bloodTestPages,
    testedUser,
    dbAuditEvent,
    dbHealthCheckService,
    dynamoDBServiceUtils
  }) => {
    const testStartDate = new Date().toISOString();
    await test.step('Go to Submit and review section and check if SectionStartCheckAnswers event was created', async () => {
      await taskListPage.goToTaskListPageAndWaitForLoading();
      await taskListPage.clickReviewAndSubmitLink();
      await submitAndReviewPages.checkYourAnswersReviewSubmitPage.waitUntilLoaded();

      const lastMessage =
        await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
          testedUser.nhsNumber,
          AuditEventType.SectionStartCheckAnswers,
          testStartDate
        );
      expect(lastMessage).toBeTruthy();
    });

    await test.step('Change gardening hours and check changes in DB', async () => {
      await submitAndReviewPages.checkYourAnswersReviewSubmitPage.clickChangeLink(
        JourneyStepNames.HoursGardeningPage
      );

      await physicalActivityPages.hoursGardeningPage.waitUntilLoaded();
      await physicalActivityPages.hoursGardeningPage.selectGardeningOptionsAndClickContinue(
        GardeningOptions.MORE_THAN_ONE_LESS_THAN_THREE
      );

      await physicalActivityPages.checkYourAnswersPage.clickSaveContinueButton();

      expect(
        await dynamoDBServiceUtils.checkQuestionnaireAnswerWasStoredInDatabase(
          'gardeningHours',
          PhysicalActivityEventsFrequency.MORE_THAN_ONE_LESS_THAN_THREE,
          testedUser
        )
      ).toBeTruthy();
    });

    await test.step('Go to Submit and review and check if updated Gardening values are displayed on the page', async () => {
      await taskListPage.clickReviewAndSubmitLink();
      await submitAndReviewPages.checkYourAnswersReviewSubmitPage.waitUntilLoaded();
      expect(
        await submitAndReviewPages.checkYourAnswersReviewSubmitPage.getAnswerValue(
          JourneyStepNames.HoursGardeningPage
        )
      ).toContain(GardeningOptions.MORE_THAN_ONE_LESS_THAN_THREE);
    });

    await test.step('Change weight and check changes in DB', async () => {
      await submitAndReviewPages.checkYourAnswersReviewSubmitPage.clickChangeLink(
        JourneyStepNames.WeightPage
      );

      await bodyMeasurementPages.whatIsYourWeightPage.waitUntilLoaded();
      await bodyMeasurementPages.whatIsYourWeightPage.inputValueInKilograms(
        '53'
      );
      await bodyMeasurementPages.whatIsYourWeightPage.clickContinueButton();

      await bodyMeasurementPages.measureYourWaistPage.waitUntilLoaded();
      await bodyMeasurementPages.measureYourWaistPage.clickContinueButton();

      await bodyMeasurementPages.whatIsYourWaistMeasurementPage.waitUntilLoaded();
      await bodyMeasurementPages.whatIsYourWaistMeasurementPage.inputValueInCentimetres(
        '72'
      );
      await bodyMeasurementPages.whatIsYourWaistMeasurementPage.clickContinueButton();

      await bodyMeasurementPages.checkYourAnswersPage.clickSaveContinueButton();

      expect(
        await dynamoDBServiceUtils.checkQuestionnaireAnswerWasStoredInDatabase(
          'weight',
          53,
          testedUser
        )
      ).toBeTruthy();
    });

    await test.step('Go to Submit and review and check if updated Weight values are displayed on the page', async () => {
      await taskListPage.clickReviewAndSubmitLink();
      await submitAndReviewPages.checkYourAnswersReviewSubmitPage.waitUntilLoaded();
      expect(
        await submitAndReviewPages.checkYourAnswersReviewSubmitPage.getAnswerValue(
          JourneyStepNames.WeightPage
        )
      ).toContain('53kg');
    });

    await test.step('Go to Submit and review, save changes and submit questionnaire', async () => {
      await submitAndReviewPages.checkYourAnswersReviewSubmitPage.clickSubmitButton();

      await bloodTestPages.orderBloodTestKitPage.waitUntilLoaded();
    });

    await test.step('Check if SectionCompleteCheckAnswers event was created in DB after completing section', async () => {
      const lastMessage =
        await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
          testedUser.nhsNumber,
          AuditEventType.SectionCompleteCheckAnswers,
          testStartDate
        );
      expect(lastMessage).toBeTruthy();
    });

    await test.step('Check is health check STEP was changed to QUESTIONNAIRE_COMPLETED', async () => {
      const healthCheckItem =
        await dbHealthCheckService.getHealthCheckItemById(healthCheckId);
      expect(healthCheckItem.step).toEqual('QUESTIONNAIRE_COMPLETED');
    });
  }
);
