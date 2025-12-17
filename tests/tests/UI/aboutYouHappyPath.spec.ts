import { test, expect } from '../../fixtures/commonFixture';
import { AuditEventType } from '@dnhc-health-checks/shared';
import { JourneyStepNames } from '../../route-paths';
import {
  AboutYouSectionDataFactory,
  AboutYouSectionDataType
} from '../../lib/flows/AboutYouSection/AboutYouSectionDataFactory';
import { AboutYouSectionFlow } from '../../lib/flows/AboutYouSection/AboutYouSectionFlow';
import {
  HealthCheckFactory,
  HealthCheckType
} from '../../testData/healthCheck/healthCheckFactory';

test.beforeEach(async ({ testedUser, dynamoDBServiceUtils, dbAuditEvent }) => {
  await dynamoDBServiceUtils.cleanHealthCheckTableAndAddHealthCheckItem(
    testedUser,
    HealthCheckFactory.createHealthCheck(
      testedUser,
      HealthCheckType.QUESTIONNAIRE_FILLED
    )
  );
  await dbAuditEvent.deleteItemByNhsNumber(testedUser.nhsNumber);
});

for (const flow of [
  AboutYouSectionDataType.NON_SMOKING_HEALTHY_OTHER_ETHNIC_MALE,
  AboutYouSectionDataType.NON_SMOKING_HEALTHY_WHITE_FEMALE
]) {
  test(
    `About You happy path - ${flow}`,
    {
      tag: ['@ui', '@happyPath', '@aboutYou', '@regression']
    },
    async ({ taskListPage, page, testedUser, dbAuditEvent }) => {
      test.slow();
      const testStartDate = new Date().toISOString();
      await taskListPage.goToTaskListPageAndWaitForLoading();

      await test.step(`Complete AboutYou section`, async () => {
        const data = new AboutYouSectionDataFactory(flow).getData();
        await new AboutYouSectionFlow(data, page, false).completeSection();
      });

      await test.step('Check if SectionStartAboutYou event was created', async () => {
        const lastMessage =
          await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
            testedUser.nhsNumber,
            AuditEventType.SectionStartAboutYou,
            testStartDate
          );
        expect(lastMessage).toBeTruthy();
      });

      await test.step('Check if SectionCompleteAboutYou event was created in DB after completing section', async () => {
        const lastMessage =
          await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
            testedUser.nhsNumber,
            AuditEventType.SectionCompleteAboutYou,
            testStartDate
          );
        expect(lastMessage).toBeTruthy();
      });
    }
  );
}

test(
  'About You check your answers',
  {
    tag: ['@ui', '@happyPath', '@aboutYou']
  },
  async ({ taskListPage, aboutYouPages, page }) => {
    await test.step(`Complete AboutYou section`, async () => {
      await taskListPage.goToTaskListPageAndWaitForLoading();

      const data = new AboutYouSectionDataFactory(
        AboutYouSectionDataType.NON_SMOKING_HEALTHY_WHITE_FEMALE
      ).getData();
      await new AboutYouSectionFlow(data, page, false, false).completeSection();

      await expect(
        aboutYouPages.checkYourAnswersPage.changeErectileDysfunctionLink
      ).not.toBeVisible();
    });

    await test.step('When sex is changed to male, shows erectile dysfunction page', async () => {
      await aboutYouPages.checkYourAnswersPage.clickChangeSexRecordedonYourMedicalRecordLink();
      await aboutYouPages.sexAssignedAtBirthPage.waitUntilLoaded();
      await aboutYouPages.sexAssignedAtBirthPage.checkMaleRadioButton();
      await aboutYouPages.sexAssignedAtBirthPage.clickContinueButton();
      await aboutYouPages.ethnicGroupPage.waitUntilLoaded();
      await aboutYouPages.ethnicGroupPage.clickContinueButton();
      await aboutYouPages.detailedEthnicGroupWhitePage.waitUntilLoaded();
      await aboutYouPages.detailedEthnicGroupWhitePage.clickContinueButton();
      await aboutYouPages.doYouSmokePage.waitUntilLoaded();
      await aboutYouPages.doYouSmokePage.clickContinueButton();

      const radioConfirmationPages = [
        aboutYouPages.lupusPage,
        aboutYouPages.severeMentalIllnessPage,
        aboutYouPages.antipsychoticMedicationPage,
        aboutYouPages.migrainesPage,
        aboutYouPages.erectileDysfunctionPage,
        aboutYouPages.steroidPage,
        aboutYouPages.rheumatoidArthritisPage
      ];

      for (const page of radioConfirmationPages) {
        await page.waitUntilLoaded();
        if (page.journeyStepName === JourneyStepNames.ErectileDysfunction) {
          await page.clickYesRadioButton();
        }
        await page.clickContinueButton();
      }

      await aboutYouPages.checkYourAnswersPage.waitUntilLoaded();
      await expect(
        aboutYouPages.checkYourAnswersPage.changeErectileDysfunctionLink
      ).toBeVisible();
    });
  }
);
