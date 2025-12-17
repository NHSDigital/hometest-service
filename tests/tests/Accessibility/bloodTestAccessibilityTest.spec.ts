import { test, expect } from '../../fixtures/commonFixture';
import AxeBuilder from '@axe-core/playwright';
import { type Result } from 'axe-core';
import {
  createHtmlAccessibilityReport,
  tagList
} from '../../lib/AccessibilityTestReportHelper';
import { getDeliverAddressWithAllFields } from '../../testData/deliveryAddressTestData';
import {
  HealthCheckFactory,
  HealthCheckType
} from '../../testData/healthCheck/healthCheckFactory';

const accessErrors: Result[] = [];

test.beforeEach(async ({ testedUser, dynamoDBServiceUtils }) => {
  await dynamoDBServiceUtils.cleanHealthCheckTableAndAddHealthCheckItem(
    testedUser,
    HealthCheckFactory.createHealthCheck(
      testedUser,
      HealthCheckType.QUESTIONNAIRE_FILLED
    )
  );
});
test(
  'Blood test Accessibility testing',
  {
    tag: ['@accessibility', '@bloodTests', '@regression']
  },
  async ({ page, taskListPage, submitAndReviewPages, bloodTestPages }) => {
    let accessibilityScanResults;

    await taskListPage.goToTaskListPageAndWaitForLoading();
    await taskListPage.clickReviewAndSubmitLink();
    await submitAndReviewPages.checkYourAnswersReviewSubmitPage.waitUntilLoaded();
    await submitAndReviewPages.checkYourAnswersReviewSubmitPage.clickSubmitButton();

    await test.step('Go to OrderBloodTestKit page', async () => {
      await bloodTestPages.orderBloodTestKitPage.waitUntilLoaded();

      accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(tagList)
        .analyze();
      accessErrors.push(
        ...(await createHtmlAccessibilityReport(
          accessibilityScanResults,
          'OrderBloodTestKitPage',
          'BloodTest',
          bloodTestPages.orderBloodTestKitPage
        ))
      );
    });

    await test.step('Go to NeedBloodTest page', async () => {
      await bloodTestPages.orderBloodTestKitPage.clickCantTakeBloodTestLink();
      await bloodTestPages.needBloodTestPage.waitUntilLoaded();

      accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(tagList)
        .analyze();
      accessErrors.push(
        ...(await createHtmlAccessibilityReport(
          accessibilityScanResults,
          'NeedBloodTestPage',
          'BloodTest',
          bloodTestPages.needBloodTestPage
        ))
      );
    });

    await test.step('Go to FindDeliveryAddress page', async () => {
      await bloodTestPages.needBloodTestPage.clickBackLink();
      await bloodTestPages.orderBloodTestKitPage.waitUntilLoaded();
      await bloodTestPages.orderBloodTestKitPage.clickContinueButton();
      await bloodTestPages.findDeliveryAddressPage.waitUntilLoaded();

      accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(tagList)
        .analyze();
      accessErrors.push(
        ...(await createHtmlAccessibilityReport(
          accessibilityScanResults,
          'FindDeliveryAddressPage',
          'BloodTest',
          bloodTestPages.findDeliveryAddressPage
        ))
      );
    });

    await test.step('Go to No Address Found page', async () => {
      await bloodTestPages.findDeliveryAddressPage.fillPostcodeField('E1 8RD');
      await bloodTestPages.findDeliveryAddressPage.fillBuildingNumberField(
        '12345'
      );
      await bloodTestPages.findDeliveryAddressPage.clickContinueButton();
      await bloodTestPages.noAddressFoundPage.waitUntilLoaded();

      accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(tagList)
        .analyze();
      accessErrors.push(
        ...(await createHtmlAccessibilityReport(
          accessibilityScanResults,
          'NoAddressFoundPage',
          'BloodTest',
          bloodTestPages.noAddressFoundPage
        ))
      );
    });

    await test.step('Go to Select Delivery Address page', async () => {
      await bloodTestPages.noAddressFoundPage.clickBackLink();
      await bloodTestPages.findDeliveryAddressPage.waitUntilLoaded();
      await bloodTestPages.findDeliveryAddressPage.fillPostcodeField('E1 8RD');
      await bloodTestPages.findDeliveryAddressPage.fillBuildingNumberField('');
      await bloodTestPages.findDeliveryAddressPage.clickContinueButton();
      await bloodTestPages.selectDeliveryAddressPage.waitUntilLoaded();

      accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(tagList)
        .analyze();
      accessErrors.push(
        ...(await createHtmlAccessibilityReport(
          accessibilityScanResults,
          'SelectDeliveryAddressPage',
          'BloodTest',
          bloodTestPages.selectDeliveryAddressPage
        ))
      );
    });

    await test.step('Go to EnterDeliveryAddress page', async () => {
      await bloodTestPages.selectDeliveryAddressPage.clickSearchAgainLink();
      await bloodTestPages.findDeliveryAddressPage.clickEnterAddressManuallyLink();
      await bloodTestPages.enterDeliveryAddressPage.waitUntilLoaded();

      accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(tagList)
        .analyze();
      accessErrors.push(
        ...(await createHtmlAccessibilityReport(
          accessibilityScanResults,
          'EnterDeliveryAddressPage',
          'BloodTest',
          bloodTestPages.enterDeliveryAddressPage
        ))
      );
    });
    await test.step('Go to EnterPhoneNumber page', async () => {
      await bloodTestPages.enterDeliveryAddressPage.fillDeliveryAddressAndClickContinue(
        getDeliverAddressWithAllFields()
      );
      await bloodTestPages.enterPhoneNumberPage.waitUntilLoaded();
      accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(tagList)
        .analyze();
      accessErrors.push(
        ...(await createHtmlAccessibilityReport(
          accessibilityScanResults,
          'EnterPhoneNumberPage',
          'BloodTest',
          bloodTestPages.enterPhoneNumberPage
        ))
      );
    });
    await test.step('Go to ConfirmAddress page', async () => {
      await bloodTestPages.enterPhoneNumberPage.waitUntilLoaded();
      await bloodTestPages.enterPhoneNumberPage.clickContinueButton();
      await bloodTestPages.confirmDetailsPage.waitUntilLoaded();

      accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(tagList)
        .analyze();
      accessErrors.push(
        ...(await createHtmlAccessibilityReport(
          accessibilityScanResults,
          'ConfirmDetailsPage',
          'BloodTest',
          bloodTestPages.confirmDetailsPage
        ))
      );
    });

    await test.step('Go to BloodTestOrdered page', async () => {
      await bloodTestPages.confirmDetailsPage.clickSaveAndContinueButton();
      await bloodTestPages.bloodTestOrderedPage.waitUntilLoaded();

      accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(tagList)
        .analyze();
      accessErrors.push(
        ...(await createHtmlAccessibilityReport(
          accessibilityScanResults,
          'BloodTestOrderedPage',
          'BloodTest',
          bloodTestPages.bloodTestOrderedPage
        ))
      );
    });
    await test.step('Check accessibility errors', () => {
      expect(accessErrors).toHaveLength(0);
    });
  }
);
