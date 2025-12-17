import { test, expect } from '../../fixtures/commonFixture';
import AxeBuilder from '@axe-core/playwright';
import { type Result } from 'axe-core';
import {
  createHtmlAccessibilityReport,
  tagList
} from '../../lib/AccessibilityTestReportHelper';
import { ConfirmBloodPressureValueOptions } from '../../page-objects/BloodPressurePages/ConfirmBloodPressureReadingsPage';

import { LowBloodPressureSymptomOptions } from '../../page-objects/BloodPressurePages/LowBloodPressureSymptomsPage';
import { BloodPressureLocation } from '../../lib/enum/health-check-answers';
import {
  HealthCheckFactory,
  HealthCheckType
} from '../../testData/healthCheck/healthCheckFactory';

let healthCheckId: string;
const accessErrors: Result[] = [];

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
  'Blood Pressure Accessibility testing',
  {
    tag: ['@accessibility', '@bloodPressure', '@regression']
  },
  async ({ page, taskListPage, bloodPressurePages, dynamoDBServiceUtils }) => {
    let accessibilityScanResults;
    await taskListPage.goToTaskListPageAndWaitForLoading();
    await taskListPage.clickCheckYourPressureLink();

    await test.step('Go to Check your blood pressure', async () => {
      await expect(
        bloodPressurePages.checkBloodPressurePage.continueButton
      ).toBeVisible();

      accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(tagList)
        .analyze();
      accessErrors.push(
        ...(await createHtmlAccessibilityReport(
          accessibilityScanResults,
          'CheckYourBloodPressurePage',
          'Blood',
          bloodPressurePages.checkBloodPressurePage
        ))
      );
    });

    await test.step('Go to Need Blood Pressure Page', async () => {
      await bloodPressurePages.checkBloodPressurePage.clickICannotTakeBloodPressureLink();
      await bloodPressurePages.needBloodPressurePage.waitUntilLoaded();

      accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(tagList)
        .analyze();
      accessErrors.push(
        ...(await createHtmlAccessibilityReport(
          accessibilityScanResults,
          'NeedBloodPressurePage',
          'Blood',
          bloodPressurePages.needBloodPressurePage
        ))
      );
    });

    await test.step('Go to Confirm Blood Pressure Reading Page', async () => {
      await bloodPressurePages.needBloodPressurePage.clickBackLink();
      await bloodPressurePages.checkBloodPressurePage.waitUntilLoaded();
      await bloodPressurePages.checkBloodPressurePage.clickContinueButton();
      await bloodPressurePages.confirmBloodPressureLocationPage.waitUntilLoaded();

      accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(tagList)
        .analyze();
      accessErrors.push(
        ...(await createHtmlAccessibilityReport(
          accessibilityScanResults,
          'ConfirmBloodPressureLocationPage',
          'Blood',
          bloodPressurePages.confirmBloodPressureLocationPage
        ))
      );
    });

    await test.step('Go to Enter Your Reading Page', async () => {
      await bloodPressurePages.confirmBloodPressureLocationPage.selectBloodPressureOptionsAndClickContinue(
        BloodPressureLocation.Monitor
      );
      await bloodPressurePages.enterYourReadingPage.waitUntilLoaded();

      accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(tagList)
        .analyze();
      accessErrors.push(
        ...(await createHtmlAccessibilityReport(
          accessibilityScanResults,
          'EnterYourReadingPage',
          'Blood',
          bloodPressurePages.enterYourReadingPage
        ))
      );
    });

    await test.step('Go to Blood Pressure Very High Page', async () => {
      await bloodPressurePages.enterYourReadingPage.fillSystolicAndDiastolicValuesAndClickContinue(
        200,
        66
      );
      await bloodPressurePages.confirmBloodPressureReadingsPage.waitUntilLoaded();
      await bloodPressurePages.confirmBloodPressureReadingsPage.selectConfirmBloodPressureValueOptionsAndClickContinue(
        ConfirmBloodPressureValueOptions.Yes
      );
      await bloodPressurePages.bloodPressureVeryHighShutterPage.waitUntilLoaded();

      accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(tagList)
        .analyze();
      accessErrors.push(
        ...(await createHtmlAccessibilityReport(
          accessibilityScanResults,
          'BloodPressureVeryHighPage',
          'Blood',
          bloodPressurePages.bloodPressureVeryHighShutterPage
        ))
      );
    });

    await test.step('Go to Check Your Answers Page', async () => {
      await test.step('Reset high blood pressure shutter page state', async () => {
        await dynamoDBServiceUtils.updateHealthCheckQuestionnaire(
          healthCheckId,
          {
            highBloodPressureValuesConfirmed: false
          }
        );
      });

      await bloodPressurePages.enterYourReadingPage.goToEnterYourReadingPage();
      await bloodPressurePages.enterYourReadingPage.waitUntilLoaded();
      await bloodPressurePages.enterYourReadingPage.fillSystolicAndDiastolicValuesAndClickContinue(
        90,
        66
      );
      await expect(
        bloodPressurePages.checkYourAnswersPage.changeReadingBloodPressureLink
      ).toBeVisible();

      accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(tagList)
        .analyze();
      accessErrors.push(
        ...(await createHtmlAccessibilityReport(
          accessibilityScanResults,
          'CheckYourAnswersPage',
          'Blood',
          bloodPressurePages.checkYourAnswersPage
        ))
      );
    });

    await test.step('Go to confirm Low blood pressure', async () => {
      await bloodPressurePages.checkYourAnswersPage.clickChangeSystolicAndDiastolicLink();
      await bloodPressurePages.enterYourReadingPage.fillSystolicAndDiastolicValuesAndClickContinue(
        80,
        55
      );
      await bloodPressurePages.confirmBloodPressureReadingsPage.waitUntilLoaded();

      accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(tagList)
        .analyze();
      accessErrors.push(
        ...(await createHtmlAccessibilityReport(
          accessibilityScanResults,
          'ConfirmBloodPressureReadingsPage',
          'Blood',
          bloodPressurePages.confirmBloodPressureReadingsPage
        ))
      );
    });

    await test.step('Go to Low blood pressure symptoms', async () => {
      await bloodPressurePages.confirmBloodPressureReadingsPage.selectConfirmBloodPressureValueOptionsAndClickContinue(
        ConfirmBloodPressureValueOptions.Yes
      );
      await bloodPressurePages.lowBloodPressureSymptomsPage.waitUntilLoaded();
      accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(tagList)
        .analyze();
      accessErrors.push(
        ...(await createHtmlAccessibilityReport(
          accessibilityScanResults,
          'LowBloodPressureSymptomsPage',
          'Blood',
          bloodPressurePages.lowBloodPressureSymptomsPage
        ))
      );
    });

    await test.step('Go to Low blood pressure shutter', async () => {
      await bloodPressurePages.lowBloodPressureSymptomsPage.waitUntilLoaded();
      await bloodPressurePages.lowBloodPressureSymptomsPage.selectLowBloodPressureSymptomOptionsAndClickContinue(
        LowBloodPressureSymptomOptions.Yes
      );
      await bloodPressurePages.lowBloodPressureShutterPage.waitUntilLoaded();
      accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(tagList)
        .analyze();
      accessErrors.push(
        ...(await createHtmlAccessibilityReport(
          accessibilityScanResults,
          'LowBloodPressureShutterPage',
          'Blood',
          bloodPressurePages.lowBloodPressureShutterPage
        ))
      );
    });

    await test.step('Check accessibility errors', () => {
      expect(accessErrors).toHaveLength(0);
    });
  }
);
