import { test, expect } from '../../fixtures/commonFixture';
import AxeBuilder from '@axe-core/playwright';
import { type Result } from 'axe-core';
import {
  createHtmlAccessibilityReport,
  tagList
} from '../../lib/AccessibilityTestReportHelper';
import { EthnicBackground, Sex } from '@dnhc-health-checks/shared';
import {
  AboutYouSectionDataFactory,
  AboutYouSectionDataType
} from '../../lib/flows/AboutYouSection/AboutYouSectionDataFactory';
import { AboutYouSectionFlow } from '../../lib/flows/AboutYouSection/AboutYouSectionFlow';
import {
  HealthCheckFactory,
  HealthCheckType
} from '../../testData/healthCheck/healthCheckFactory';

const accessErrors: Result[] = [];
test.beforeEach(async ({ dynamoDBServiceUtils, testedUser }) => {
  await dynamoDBServiceUtils.cleanHealthCheckTableAndAddHealthCheckItem(
    testedUser,
    HealthCheckFactory.createHealthCheck(
      testedUser,
      HealthCheckType.QUESTIONNAIRE_FILLED
    )
  );
});

test(
  'Check AboutYou Accessibility tests',
  {
    tag: ['@accessibility', '@physicalActivity', '@regression']
  },
  async ({ page, taskListPage }) => {
    test.slow();
    await taskListPage.goToTaskListPageAndWaitForLoading();

    const data = new AboutYouSectionDataFactory(
      AboutYouSectionDataType.NON_SMOKING_HEALTHY_OTHER_ETHNIC_MALE
    ).getData();
    await new AboutYouSectionFlow(data, page, true, true).completeSection();
  }
);

test(
  'About You Detailed Ethnic Group Accessibility testing',
  {
    tag: ['@accessibility', '@aboutYou', '@regression']
  },
  async ({ taskListPage, aboutYouPages, page }) => {
    test.slow();
    let accessibilityScanResults;
    await taskListPage.goToTaskListPageAndWaitForLoading();
    await taskListPage.clickAboutYouLink();
    await aboutYouPages.townsendPostcodePage.waitUntilLoaded();
    await aboutYouPages.townsendPostcodePage.clickContinueButton();
    await aboutYouPages.familyHeartAttackHistoryPage.waitUntilLoaded();
    await aboutYouPages.familyHeartAttackHistoryPage.clickNoRadioButton();
    await aboutYouPages.familyHeartAttackHistoryPage.clickContinueButton();
    await aboutYouPages.familyDiabetesHistoryPage.waitUntilLoaded();
    await aboutYouPages.familyDiabetesHistoryPage.clickNoRadioButton();
    await aboutYouPages.familyDiabetesHistoryPage.clickContinueButton();
    await aboutYouPages.familyDiabetesHistoryPage.waitUntilLoaded();
    await aboutYouPages.sexAssignedAtBirthPage.waitUntilLoaded();
    await aboutYouPages.sexAssignedAtBirthPage.selectSexAssignedAtBirthOptionsAndClickContinue(
      Sex.Male
    );
    await aboutYouPages.ethnicGroupPage.waitUntilLoaded();

    await test.step('Go to Detailed Asian ethnic background page', async () => {
      await aboutYouPages.ethnicGroupPage.selectEthnicAndClickContinueButton(
        EthnicBackground.AsianOrAsianBritish
      );
      await aboutYouPages.detailedEthnicGroupAsianPage.waitUntilLoaded();

      accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(tagList)
        .analyze();
      accessErrors.push(
        ...(await createHtmlAccessibilityReport(
          accessibilityScanResults,
          'DetailedAsianEthnicBackgroundPage',
          'AboutYou',
          aboutYouPages.detailedEthnicGroupAsianPage
        ))
      );
    });

    await test.step('Go to Detailed Black ethnic background page', async () => {
      await aboutYouPages.detailedEthnicGroupAsianPage.clickBackLink();
      await aboutYouPages.ethnicGroupPage.selectEthnicAndClickContinueButton(
        EthnicBackground.BlackAfricanCaribbeanOrBlackBritish
      );

      await aboutYouPages.detailedEthnicGroupBlackPage.waitUntilLoaded();

      accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(tagList)
        .analyze();
      accessErrors.push(
        ...(await createHtmlAccessibilityReport(
          accessibilityScanResults,
          'DetailedBlackEthnicBackgroundPage',
          'AboutYou',
          aboutYouPages.detailedEthnicGroupBlackPage
        ))
      );
    });

    await test.step('Go to Detailed Mixed ethnic background page', async () => {
      await aboutYouPages.detailedEthnicGroupBlackPage.clickBackLink();
      await aboutYouPages.ethnicGroupPage.selectEthnicAndClickContinueButton(
        EthnicBackground.MixedOrMultipleGroups
      );
      await aboutYouPages.detailedEthnicGroupMixedEthnicPage.waitUntilLoaded();

      accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(tagList)
        .analyze();
      accessErrors.push(
        ...(await createHtmlAccessibilityReport(
          accessibilityScanResults,
          'DetailedMixedEthnicBackgroundPage',
          'AboutYou',
          aboutYouPages.detailedEthnicGroupMixedEthnicPage
        ))
      );
    });

    await test.step('Go to Detailed White ethnic background page', async () => {
      await aboutYouPages.detailedEthnicGroupMixedEthnicPage.clickBackLink();
      await aboutYouPages.ethnicGroupPage.selectEthnicAndClickContinueButton(
        EthnicBackground.White
      );
      await aboutYouPages.detailedEthnicGroupWhitePage.waitUntilLoaded();

      accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(tagList)
        .analyze();
      accessErrors.push(
        ...(await createHtmlAccessibilityReport(
          accessibilityScanResults,
          'DetailedWhiteEthnicBackgroundPage',
          'AboutYou',
          aboutYouPages.detailedEthnicGroupWhitePage
        ))
      );
    });

    await test.step('Go to Detailed Other ethnic background page', async () => {
      await aboutYouPages.detailedEthnicGroupWhitePage.clickBackLink();
      await aboutYouPages.ethnicGroupPage.selectEthnicAndClickContinueButton(
        EthnicBackground.Other
      );
      await aboutYouPages.detailedOtherEthnicGroupPage.waitUntilLoaded();

      accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(tagList)
        .analyze();
      accessErrors.push(
        ...(await createHtmlAccessibilityReport(
          accessibilityScanResults,
          'DetailedOtherEthnicBackgroundPage',
          'AboutYou',
          aboutYouPages.detailedOtherEthnicGroupPage
        ))
      );
    });

    await test.step('Check accessibility errors', () => {
      expect(accessErrors).toHaveLength(0);
    });
  }
);
