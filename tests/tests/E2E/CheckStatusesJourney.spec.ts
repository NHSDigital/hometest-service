import { test, expect } from '../../fixtures/commonFixture';
import { TaskListPage } from '../../page-objects/TaskListPage';
import { WalkOptions } from '../../page-objects/PhysicalActivityPages/HoursWalkedPage';
import { CycleOptions } from '../../page-objects/PhysicalActivityPages/HoursCycledPage';
import { WorkActivityOptions } from '../../page-objects/PhysicalActivityPages/WorkActivityPage';
import { ExerciseOptions } from '../../page-objects/PhysicalActivityPages/HoursExercisedPage';
import { BloodPressureLocation } from '../../lib/enum/health-check-answers';
import {
  AboutYouSectionDataFactory,
  AboutYouSectionDataType
} from '../../lib/flows/AboutYouSection/AboutYouSectionDataFactory';
import { AboutYouSectionFlow } from '../../lib/flows/AboutYouSection/AboutYouSectionFlow';
import {
  BodyMeasurementsSectionDataFactory,
  BodyMeasurementsSectionDataType
} from '../../lib/flows/BodyMeasurementsSection/BodyMeasurementsSectionDataFactory';
import { BodyMeasurementsSectionFlow } from '../../lib/flows/BodyMeasurementsSection/BodyMeasurementsSectionFlow';
import {
  HealthCheckFactory,
  HealthCheckType
} from '../../testData/healthCheck/healthCheckFactory';
import {
  EligibilitySectionDataFactory,
  EligibilitySectionDataType
} from '../../lib/flows/EligibilitySection/EligibilitySectionDataFactory';
import { EligibilitySectionFlow } from '../../lib/flows/EligibilitySection/EligibilitySectionFlow';

let taskListPage: TaskListPage;

enum SectionStatusType {
  NOT_STARTED = 'Not started',
  STARTED = 'Started',
  CANNOT_START = 'Cannot start yet',
  COMPLETED = 'Completed'
}

interface SectionsStatuses {
  aboutYouStatus: SectionStatusType;
  physicalActivityStatus: SectionStatusType;
  alcoholConsumptionStatus: SectionStatusType;
  enterBodyMeasurementsStatus: SectionStatusType;
  checkYourBloodPressureStatus: SectionStatusType;
  reviewAndSubmitStatus: SectionStatusType;
  orderABloodTestKitStatus: SectionStatusType;
}

async function checkSectionsStatuses(
  sectionStatuses: SectionsStatuses
): Promise<void> {
  await expect(taskListPage.aboutYouStatus).toHaveText(
    sectionStatuses.aboutYouStatus
  );
  await expect(taskListPage.physicalActivityStatus).toHaveText(
    sectionStatuses.physicalActivityStatus
  );
  await expect(taskListPage.alcoholConsumptionStatus).toHaveText(
    sectionStatuses.alcoholConsumptionStatus
  );
  await expect(taskListPage.enterBodyMeasurementsStatus).toHaveText(
    sectionStatuses.enterBodyMeasurementsStatus
  );
  await expect(taskListPage.yourBloodPressureStatus).toHaveText(
    sectionStatuses.checkYourBloodPressureStatus
  );
  await expect(taskListPage.reviewAndSubmitStatus).toHaveText(
    sectionStatuses.reviewAndSubmitStatus
  );
  await expect(taskListPage.orderABloodTestKitStatus).toHaveText(
    sectionStatuses.orderABloodTestKitStatus
  );
}

interface SectionLinksClickableStatus {
  aboutYouLinkClickable: boolean;
  physicalActivityLinkClickable: boolean;
  alcoholConsumptionLinkClickable: boolean;
  enterBodyMeasurementsLinkClickable: boolean;
  checkYourBloodPressureLinkClickable: boolean;
  reviewAndSubmitLinkClickable: boolean;
  orderABloodTestKitLinkClickable: boolean;
}

async function checkIfLinkIsClickable(
  sectionsLinksStatuses: SectionLinksClickableStatus
): Promise<void> {
  expect(await taskListPage.aboutYouLink.isVisible()).toEqual(
    sectionsLinksStatuses.aboutYouLinkClickable
  );
  expect(await taskListPage.physicalActivityLink.isVisible()).toEqual(
    sectionsLinksStatuses.physicalActivityLinkClickable
  );
  expect(await taskListPage.alcoholConsumptionLink.isVisible()).toEqual(
    sectionsLinksStatuses.alcoholConsumptionLinkClickable
  );
  expect(await taskListPage.enterBodyMeasurementsLink.isVisible()).toEqual(
    sectionsLinksStatuses.enterBodyMeasurementsLinkClickable
  );
  expect(await taskListPage.checkYourPressureLink.isVisible()).toEqual(
    sectionsLinksStatuses.checkYourBloodPressureLinkClickable
  );
  expect(await taskListPage.reviewAndSubmitLink.isVisible()).toEqual(
    sectionsLinksStatuses.reviewAndSubmitLinkClickable
  );
  expect(await taskListPage.orderABloodTestKitLink.isVisible()).toEqual(
    sectionsLinksStatuses.orderABloodTestKitLinkClickable
  );
}

test.beforeEach(async ({ page, testedUser, dynamoDBServiceUtils }) => {
  const healthCheckToCreate = HealthCheckFactory.createHealthCheck(
    testedUser,
    HealthCheckType.INITIAL
  );

  await dynamoDBServiceUtils.cleanHealthCheckTableAndAddHealthCheckItem(
    testedUser,
    healthCheckToCreate
  );

  taskListPage = new TaskListPage(page);
});

test(
  'e2e flow health check journey',
  {
    tag: ['@ui', '@regression', '@happyPath']
  },
  async ({
    page,
    taskListPage,
    nhsLoginPages,
    aboutYouPages,
    physicalActivityPages,
    alcoholConsumptionPages,
    bodyMeasurementPages,
    bloodPressurePages,
    bloodTestPages,
    submitAndReviewPages
  }) => {
    test.slow();
    await test.step('Go to task list and check statuses', async () => {
      await nhsLoginPages.nhsFirstPage.goToTheQuestionnaireAppURL();
      const data = new EligibilitySectionDataFactory(
        EligibilitySectionDataType.ELIGIBLE_USER
      ).getData();
      await new EligibilitySectionFlow(data, page).completeSection();
      await taskListPage.goToTaskListPageAndWaitForLoading();

      await checkSectionsStatuses({
        aboutYouStatus: SectionStatusType.NOT_STARTED,
        physicalActivityStatus: SectionStatusType.NOT_STARTED,
        alcoholConsumptionStatus: SectionStatusType.NOT_STARTED,
        enterBodyMeasurementsStatus: SectionStatusType.NOT_STARTED,
        checkYourBloodPressureStatus: SectionStatusType.CANNOT_START,
        reviewAndSubmitStatus: SectionStatusType.CANNOT_START,
        orderABloodTestKitStatus: SectionStatusType.CANNOT_START
      });
    });

    await test.step('Check if links are active for all sections besides ReviewSubmit, bloodPressure and OrderBloodTestKit', async () => {
      await checkIfLinkIsClickable({
        aboutYouLinkClickable: true,
        physicalActivityLinkClickable: true,
        alcoholConsumptionLinkClickable: true,
        enterBodyMeasurementsLinkClickable: true,
        checkYourBloodPressureLinkClickable: false,
        reviewAndSubmitLinkClickable: false,
        orderABloodTestKitLinkClickable: false
      });
    });

    await test.step('About you section check "Started" status', async () => {
      await taskListPage.clickAboutYouLink();
      await aboutYouPages.townsendPostcodePage.waitUntilLoaded();
      await aboutYouPages.townsendPostcodePage.fillPostcodeField('AB1 1AB');
      await aboutYouPages.townsendPostcodePage.clickContinueButton();
      await aboutYouPages.familyHeartAttackHistoryPage.waitUntilLoaded();
      await aboutYouPages.familyHeartAttackHistoryPage.clickYesRadioButton();
      await aboutYouPages.familyHeartAttackHistoryPage.clickContinueButton();
      await aboutYouPages.familyDiabetesHistoryPage.waitUntilLoaded();
      await aboutYouPages.familyDiabetesHistoryPage.clickNoRadioButton();
      await aboutYouPages.familyDiabetesHistoryPage.clickContinueButton();
      await aboutYouPages.sexAssignedAtBirthPage.waitUntilLoaded();
      await taskListPage.goToTaskListPageAndWaitForLoading();
      await taskListPage.waitUntilLoaded();

      await checkSectionsStatuses({
        aboutYouStatus: SectionStatusType.STARTED,
        physicalActivityStatus: SectionStatusType.NOT_STARTED,
        alcoholConsumptionStatus: SectionStatusType.NOT_STARTED,
        enterBodyMeasurementsStatus: SectionStatusType.NOT_STARTED,
        checkYourBloodPressureStatus: SectionStatusType.CANNOT_START,
        reviewAndSubmitStatus: SectionStatusType.CANNOT_START,
        orderABloodTestKitStatus: SectionStatusType.CANNOT_START
      });
    });

    await test.step('About you section check "Completed" status', async () => {
      const data = new AboutYouSectionDataFactory(
        AboutYouSectionDataType.HIGH_RISK_ASIAN_MALE
      ).getData();
      await new AboutYouSectionFlow(data, page, false).completeSection();

      await checkSectionsStatuses({
        aboutYouStatus: SectionStatusType.COMPLETED,
        physicalActivityStatus: SectionStatusType.NOT_STARTED,
        alcoholConsumptionStatus: SectionStatusType.NOT_STARTED,
        enterBodyMeasurementsStatus: SectionStatusType.NOT_STARTED,
        checkYourBloodPressureStatus: SectionStatusType.CANNOT_START,
        reviewAndSubmitStatus: SectionStatusType.CANNOT_START,
        orderABloodTestKitStatus: SectionStatusType.CANNOT_START
      });
    });

    await test.step('Physical activity check "Started" status', async () => {
      await taskListPage.clickPhysicalActivityLink();
      await physicalActivityPages.hoursExercisedPage.waitUntilLoaded();
      await physicalActivityPages.hoursExercisedPage.selectExerciseOptionsAndClickContinue(
        ExerciseOptions.LESS_THAN_ONE_HOUR
      );
      await physicalActivityPages.hoursWalkedPage.waitUntilLoaded();
      await taskListPage.goToTaskListPageAndWaitForLoading();
      await taskListPage.waitUntilLoaded();

      await checkSectionsStatuses({
        aboutYouStatus: SectionStatusType.COMPLETED,
        physicalActivityStatus: SectionStatusType.STARTED,
        alcoholConsumptionStatus: SectionStatusType.NOT_STARTED,
        enterBodyMeasurementsStatus: SectionStatusType.NOT_STARTED,
        checkYourBloodPressureStatus: SectionStatusType.CANNOT_START,
        reviewAndSubmitStatus: SectionStatusType.CANNOT_START,
        orderABloodTestKitStatus: SectionStatusType.CANNOT_START
      });
    });

    await test.step('Physical activity check "Completed" status (without optional fields)', async () => {
      await taskListPage.clickPhysicalActivityLink();
      await physicalActivityPages.hoursExercisedPage.waitUntilLoaded();
      await physicalActivityPages.hoursExercisedPage.selectExerciseOptionsAndClickContinue(
        ExerciseOptions.LESS_THAN_ONE_HOUR
      );
      await physicalActivityPages.hoursWalkedPage.waitUntilLoaded();
      await physicalActivityPages.hoursWalkedPage.selectWalkOptionsAndClickContinue(
        WalkOptions.MORE_THAN_ONE_LESS_THAN_THREE
      );
      // optional question
      await physicalActivityPages.walkingPacePage.waitUntilLoaded();
      await physicalActivityPages.walkingPacePage.clickContinueButton();
      await physicalActivityPages.hoursCycledPage.waitUntilLoaded();
      await physicalActivityPages.hoursCycledPage.selectCycleOptionsAndClickContinue(
        CycleOptions.NONE
      );
      await physicalActivityPages.workActivityPage.waitUntilLoaded();
      await physicalActivityPages.workActivityPage.selectWorkActivityOptionsAndClickContinue(
        WorkActivityOptions.PHYSICAL_MEDIUM
      );

      // optional section
      await physicalActivityPages.everydayMovementPage.waitUntilLoaded();
      await physicalActivityPages.everydayMovementPage.clickContinueButton();
      await physicalActivityPages.hoursHouseworkPage.waitUntilLoaded();
      await physicalActivityPages.hoursHouseworkPage.clickContinueButton();
      await physicalActivityPages.hoursGardeningPage.waitUntilLoaded();
      await physicalActivityPages.hoursGardeningPage.clickContinueButton();

      await physicalActivityPages.checkYourAnswersPage.waitUntilLoaded();
      await physicalActivityPages.checkYourAnswersPage.clickSaveContinueButton();
      await taskListPage.waitUntilLoaded();

      await checkSectionsStatuses({
        aboutYouStatus: SectionStatusType.COMPLETED,
        physicalActivityStatus: SectionStatusType.COMPLETED,
        alcoholConsumptionStatus: SectionStatusType.NOT_STARTED,
        enterBodyMeasurementsStatus: SectionStatusType.NOT_STARTED,
        checkYourBloodPressureStatus: SectionStatusType.CANNOT_START,
        reviewAndSubmitStatus: SectionStatusType.CANNOT_START,
        orderABloodTestKitStatus: SectionStatusType.CANNOT_START
      });
    });

    await test.step('Alcohol Consumption check "Started" status', async () => {
      await taskListPage.clickAlcoholConsumptionLink();
      await alcoholConsumptionPages.doYouDrinkAlcoholPage.waitUntilLoaded();
      await alcoholConsumptionPages.doYouDrinkAlcoholPage.checkYesIDrinkAlcohol();
      await alcoholConsumptionPages.doYouDrinkAlcoholPage.clickContinueButton();
      await alcoholConsumptionPages.howOftenAlcoholPage.waitUntilLoaded();
      await taskListPage.goToTaskListPageAndWaitForLoading();
      await taskListPage.waitUntilLoaded();

      await checkSectionsStatuses({
        aboutYouStatus: SectionStatusType.COMPLETED,
        physicalActivityStatus: SectionStatusType.COMPLETED,
        alcoholConsumptionStatus: SectionStatusType.STARTED,
        enterBodyMeasurementsStatus: SectionStatusType.NOT_STARTED,
        checkYourBloodPressureStatus: SectionStatusType.CANNOT_START,
        reviewAndSubmitStatus: SectionStatusType.CANNOT_START,
        orderABloodTestKitStatus: SectionStatusType.CANNOT_START
      });
    });

    await test.step('Alcohol Consumption check "Completed" status', async () => {
      await taskListPage.clickAlcoholConsumptionLink();
      await alcoholConsumptionPages.doYouDrinkAlcoholPage.waitUntilLoaded();
      await alcoholConsumptionPages.doYouDrinkAlcoholPage.checkNoIHaveNever();
      await alcoholConsumptionPages.doYouDrinkAlcoholPage.clickContinueButton();
      await alcoholConsumptionPages.checkYourAnswersPage.waitUntilLoaded();
      await alcoholConsumptionPages.checkYourAnswersPage.clickSaveContinueButton();
      await taskListPage.waitUntilLoaded();

      await checkSectionsStatuses({
        aboutYouStatus: SectionStatusType.COMPLETED,
        physicalActivityStatus: SectionStatusType.COMPLETED,
        alcoholConsumptionStatus: SectionStatusType.COMPLETED,
        enterBodyMeasurementsStatus: SectionStatusType.NOT_STARTED,
        checkYourBloodPressureStatus: SectionStatusType.CANNOT_START,
        reviewAndSubmitStatus: SectionStatusType.CANNOT_START,
        orderABloodTestKitStatus: SectionStatusType.CANNOT_START
      });
    });

    await test.step('Enter body measurements check "Started" status', async () => {
      await taskListPage.clickEnterBodyMeasurementsLink();
      await bodyMeasurementPages.whatIsYourHeightPage.waitUntilLoaded();
      await bodyMeasurementPages.whatIsYourHeightPage.inputValueInFeetAndInches(
        '5',
        '7'
      );
      await bodyMeasurementPages.whatIsYourHeightPage.clickContinueButton();
      await bodyMeasurementPages.whatIsYourWeightPage.waitUntilLoaded();
      await taskListPage.goToTaskListPageAndWaitForLoading();
      await taskListPage.waitUntilLoaded();

      await checkSectionsStatuses({
        aboutYouStatus: SectionStatusType.COMPLETED,
        physicalActivityStatus: SectionStatusType.COMPLETED,
        alcoholConsumptionStatus: SectionStatusType.COMPLETED,
        enterBodyMeasurementsStatus: SectionStatusType.STARTED,
        checkYourBloodPressureStatus: SectionStatusType.CANNOT_START,
        reviewAndSubmitStatus: SectionStatusType.CANNOT_START,
        orderABloodTestKitStatus: SectionStatusType.CANNOT_START
      });
    });
    await test.step('Enter body measurements check "Completed" status', async () => {
      const data = new BodyMeasurementsSectionDataFactory(
        BodyMeasurementsSectionDataType.UNHEALTHY_BMI
      ).getData();
      await new BodyMeasurementsSectionFlow(data, page, true).completeSection();

      await checkSectionsStatuses({
        aboutYouStatus: SectionStatusType.COMPLETED,
        physicalActivityStatus: SectionStatusType.COMPLETED,
        alcoholConsumptionStatus: SectionStatusType.COMPLETED,
        enterBodyMeasurementsStatus: SectionStatusType.COMPLETED,
        checkYourBloodPressureStatus: SectionStatusType.NOT_STARTED,
        reviewAndSubmitStatus: SectionStatusType.CANNOT_START,
        orderABloodTestKitStatus: SectionStatusType.CANNOT_START
      });
    });

    await test.step('Blood pressure check "Started" status', async () => {
      await taskListPage.clickCheckYourPressureLink();
      await bloodPressurePages.checkBloodPressurePage.waitUntilLoaded();
      await bloodPressurePages.checkBloodPressurePage.clickContinueButton();
      await bloodPressurePages.confirmBloodPressureLocationPage.selectBloodPressureOptionsAndClickContinue(
        BloodPressureLocation.Pharmacy
      );
      await bloodPressurePages.enterYourReadingPage.waitUntilLoaded();
      await taskListPage.goToTaskListPageAndWaitForLoading();
      await taskListPage.waitUntilLoaded();

      await checkSectionsStatuses({
        aboutYouStatus: SectionStatusType.COMPLETED,
        physicalActivityStatus: SectionStatusType.COMPLETED,
        alcoholConsumptionStatus: SectionStatusType.COMPLETED,
        enterBodyMeasurementsStatus: SectionStatusType.COMPLETED,
        checkYourBloodPressureStatus: SectionStatusType.STARTED,
        reviewAndSubmitStatus: SectionStatusType.CANNOT_START,
        orderABloodTestKitStatus: SectionStatusType.CANNOT_START
      });
    });

    await test.step('Blood pressure check "Completed" status', async () => {
      await taskListPage.clickCheckYourPressureLink();
      await bloodPressurePages.checkBloodPressurePage.waitUntilLoaded();
      await bloodPressurePages.checkBloodPressurePage.clickContinueButton();
      await bloodPressurePages.confirmBloodPressureLocationPage.selectBloodPressureOptionsAndClickContinue(
        BloodPressureLocation.Monitor
      );

      await bloodPressurePages.enterYourReadingPage.waitUntilLoaded();
      expect(
        await bloodPressurePages.enterYourReadingPage.iNeedHelpMeasuringInfo.isVisible()
      ).toBeTruthy();

      await bloodPressurePages.enterYourReadingPage.fillSystolicAndDiastolicValuesAndClickContinue(
        120,
        70
      );
      await bloodPressurePages.checkYourAnswersPage.waitUntilLoaded();
      await bloodPressurePages.checkYourAnswersPage.clickSaveAndContinueButton();
      await taskListPage.waitUntilLoaded();

      await checkSectionsStatuses({
        aboutYouStatus: SectionStatusType.COMPLETED,
        physicalActivityStatus: SectionStatusType.COMPLETED,
        alcoholConsumptionStatus: SectionStatusType.COMPLETED,
        enterBodyMeasurementsStatus: SectionStatusType.COMPLETED,
        checkYourBloodPressureStatus: SectionStatusType.COMPLETED,
        reviewAndSubmitStatus: SectionStatusType.NOT_STARTED,
        orderABloodTestKitStatus: SectionStatusType.CANNOT_START
      });
    });

    await test.step('Check if link for ReviewSubmit is active', async () => {
      await checkIfLinkIsClickable({
        aboutYouLinkClickable: true,
        physicalActivityLinkClickable: true,
        alcoholConsumptionLinkClickable: true,
        enterBodyMeasurementsLinkClickable: true,
        checkYourBloodPressureLinkClickable: true,
        reviewAndSubmitLinkClickable: true,
        orderABloodTestKitLinkClickable: false
      });
    });

    await test.step('Go to Submit section, submit questionnaire, and check if section status is "Completed"', async () => {
      await taskListPage.clickReviewAndSubmitLink();
      await submitAndReviewPages.checkYourAnswersReviewSubmitPage.waitUntilLoaded();
      await submitAndReviewPages.checkYourAnswersReviewSubmitPage.clickSubmitButton();

      await bloodTestPages.orderBloodTestKitPage.waitUntilLoaded();
      await bloodTestPages.orderBloodTestKitPage.clickBackLink();
      await taskListPage.waitUntilLoaded();

      await checkSectionsStatuses({
        aboutYouStatus: SectionStatusType.COMPLETED,
        physicalActivityStatus: SectionStatusType.COMPLETED,
        alcoholConsumptionStatus: SectionStatusType.COMPLETED,
        enterBodyMeasurementsStatus: SectionStatusType.COMPLETED,
        checkYourBloodPressureStatus: SectionStatusType.COMPLETED,
        reviewAndSubmitStatus: SectionStatusType.COMPLETED,
        orderABloodTestKitStatus: SectionStatusType.NOT_STARTED
      });
    });

    await test.step('Check if link to Blood test is active and all other sections are not clickable after submitting questionnaire', async () => {
      await checkIfLinkIsClickable({
        aboutYouLinkClickable: false,
        physicalActivityLinkClickable: false,
        alcoholConsumptionLinkClickable: false,
        enterBodyMeasurementsLinkClickable: false,
        checkYourBloodPressureLinkClickable: false,
        reviewAndSubmitLinkClickable: false,
        orderABloodTestKitLinkClickable: true
      });
    });

    await test.step('Check if Blood test section status is correct after starting the section', async () => {
      await taskListPage.clickOrderABloodTestKitLink();
      await bloodTestPages.orderBloodTestKitPage.waitUntilLoaded();
      await bloodTestPages.orderBloodTestKitPage.clickContinueButton();
      await bloodTestPages.findDeliveryAddressPage.waitUntilLoaded();
      await taskListPage.goToTaskListPageAndWaitForLoading();
      await taskListPage.waitUntilLoaded();

      await checkSectionsStatuses({
        aboutYouStatus: SectionStatusType.COMPLETED,
        physicalActivityStatus: SectionStatusType.COMPLETED,
        alcoholConsumptionStatus: SectionStatusType.COMPLETED,
        enterBodyMeasurementsStatus: SectionStatusType.COMPLETED,
        checkYourBloodPressureStatus: SectionStatusType.COMPLETED,
        reviewAndSubmitStatus: SectionStatusType.COMPLETED,
        orderABloodTestKitStatus: SectionStatusType.STARTED
      });
    });
  }
);
