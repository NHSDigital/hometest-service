import { test, expect } from '../../../fixtures/commonFixture';
import { type Config, ConfigFactory } from '../../../env/config';
import AxeBuilder from '@axe-core/playwright';
import { type Result } from 'axe-core';
import {
  createHtmlAccessibilityReport,
  tagList
} from '../../../lib/AccessibilityTestReportHelper';
import DbPatientService from '../../../lib/aws/dynamoDB/DbPatientService';
import { getPatientDbItem } from '../../../testData/patientTestData';
import { DynamoDBServiceUtils } from '../../../lib/aws/dynamoDB/DynamoDBServiceUtils';
import DbHealthCheckService from '../../../lib/aws/dynamoDB/DbHealthCheckService';
import NhsLoginHelper from '../../../page-objects/NhsLoginHelper';
import {
  HealthCheckFactory,
  HealthCheckType
} from '../../../testData/healthCheck/healthCheckFactory';
import type { BaseTestUser, NHSLoginUser } from '../../../lib/users/BaseUser';
import { SpecialUserKey } from '../../../lib/users/SpecialUserKey';

const config: Config = ConfigFactory.getConfig();
const dynamoDBServiceUtils = new DynamoDBServiceUtils(config);
const dbPatientService = new DbPatientService(config.name);
const dbHealthCheckService = new DbHealthCheckService(config.name);
const nhsLoginHelper = new NhsLoginHelper();
const accessibilityTestSection = 'Initial Screens';
let eligibleUser: BaseTestUser;

const accessErrors: Result[] = [];

export default function initialScreensAccessibilityTest(): void {
  test.beforeEach(async ({ page, context, nhsLoginPages, userManager }) => {
    eligibleUser = userManager.getSpecialUser(SpecialUserKey.LOGOUT_DEDICATED_USER);

    await dynamoDBServiceUtils.cleanHealthCheckTableAndAddHealthCheckItem(
      eligibleUser,
      HealthCheckFactory.createHealthCheck(
        eligibleUser,
        HealthCheckType.INITIAL
      )
    );
    await context.clearCookies();
    await dbHealthCheckService.deleteItemByNhsNumber(eligibleUser.nhsNumber);
    await dbPatientService.deletePatientItemByNhsNumber(eligibleUser.nhsNumber);

    if (!config.integratedEnvironment) {
      await nhsLoginPages.nhsFirstPage.goToTheQuestionnaireAppURLWithLoginMock(
        eligibleUser.code as string
      );
    } else {
      await nhsLoginPages.nhsFirstPage.goToTheQuestionnaireAppUrlAndClickContinue();
      await nhsLoginPages.nhsAppRedirectorPage.waitUntilLoadedAndClickContinue();
      await nhsLoginHelper.fillNhsLoginFormsAndWaitForNextPage(
        eligibleUser as NHSLoginUser,
        page
      );
    }
  });

  test(
    'Initial Screens Accessibility tests',
    {
      tag: ['@accessibility', '@regression']
    },
    async ({
      page,
      completeHealthCheckFirstPage,
      termsAndConditionsPage,
      eligibilityPages,
      logoutPage,
      nhsLoginPages,
      aboutThisSoftwarePage
    }) => {
      test.skip(config.integratedEnvironment);
      let accessibilityScanResults;

      await test.step('Go to Start Health Check page', async () => {
        await completeHealthCheckFirstPage.waitUntilLoaded();
        accessibilityScanResults = await new AxeBuilder({ page })
          .withTags(tagList)
          .analyze();
        accessErrors.push(
          ...(await createHtmlAccessibilityReport(
            accessibilityScanResults,
            'CompleteHealthCheckFirstPage',
            accessibilityTestSection,
            completeHealthCheckFirstPage
          ))
        );
      });

      await test.step('Go to About this Software page', async () => {
        await completeHealthCheckFirstPage.clickAboutThisSoftwareLink();
        await aboutThisSoftwarePage.waitUntilLoaded();

        accessibilityScanResults = await new AxeBuilder({ page })
          .withTags(tagList)
          .analyze();
        accessErrors.push(
          ...(await createHtmlAccessibilityReport(
            accessibilityScanResults,
            'AboutThisSoftwarePage',
            accessibilityTestSection,
            aboutThisSoftwarePage
          ))
        );
      });

      await test.step('Go to TermsAndConditions page', async () => {
        await aboutThisSoftwarePage.clickBackLink();
        await completeHealthCheckFirstPage.waitUntilLoaded();
        await completeHealthCheckFirstPage.clickStartNowBtn();
        await termsAndConditionsPage.waitUntilLoaded();
        accessibilityScanResults = await new AxeBuilder({ page })
          .withTags(tagList)
          .analyze();
        accessErrors.push(
          ...(await createHtmlAccessibilityReport(
            accessibilityScanResults,
            'TermsAndConditionsPage',
            accessibilityTestSection,
            termsAndConditionsPage
          ))
        );
        await dbPatientService.createPatient(
          getPatientDbItem(eligibleUser.nhsNumber, eligibleUser.patientId)
        );
      });

      await test.step('Go to the First page', async () => {
        await eligibilityPages.receivedInvitationQueryPage.clickLogoutButton();
        await logoutPage.waitUntilLoaded();
        await page.goto(`${config.questionnaireAppURL}/`);
        await expect(nhsLoginPages.nhsFirstPage.getStartedBtn).toBeVisible();

        accessibilityScanResults = await new AxeBuilder({ page })
          .withTags(tagList)
          .analyze();
        accessErrors.push(
          ...(await createHtmlAccessibilityReport(
            accessibilityScanResults,
            'MainPage',
            accessibilityTestSection,
            nhsLoginPages.nhsFirstPage
          ))
        );
      });

      await test.step('Check accessibility errors', () => {
        expect(accessErrors).toHaveLength(0);
      });
    }
  );
}
