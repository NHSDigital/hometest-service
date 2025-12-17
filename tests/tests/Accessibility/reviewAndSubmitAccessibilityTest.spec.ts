import { test, expect } from '../../fixtures/commonFixture';
import AxeBuilder from '@axe-core/playwright';
import { type Result } from 'axe-core';
import {
  createHtmlAccessibilityReport,
  tagList
} from '../../lib/AccessibilityTestReportHelper';
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
  'Review And Submit Accessibility tests',
  {
    tag: ['@accessibility', '@regression']
  },
  async ({ page, taskListPage, submitAndReviewPages }) => {
    let accessibilityScanResults;
    await taskListPage.goToTaskListPageAndWaitForLoading();
    await taskListPage.clickReviewAndSubmitLink();

    await test.step('Verify Check Your Answer page', async () => {
      await submitAndReviewPages.checkYourAnswersReviewSubmitPage.waitUntilLoaded();

      accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(tagList)
        .analyze();
      accessErrors.push(
        ...(await createHtmlAccessibilityReport(
          accessibilityScanResults,
          'CheckYourAnswersPage',
          'ReviewAndSubmit',
          submitAndReviewPages.checkYourAnswersReviewSubmitPage
        ))
      );
    });

    await test.step('Check accessibility errors', () => {
      expect(accessErrors).toHaveLength(0);
    });
  }
);
