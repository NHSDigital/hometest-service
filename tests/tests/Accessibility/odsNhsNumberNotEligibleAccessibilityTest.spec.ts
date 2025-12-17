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
    HealthCheckFactory.createHealthCheck(testedUser, HealthCheckType.INITIAL)
  );
});

test(
  'ODS/NHS number eligibility shutter screen Accessibility tests',
  {
    tag: ['@accessibility', '@regression']
  },
  async ({ page, odsNhsNumberNotEligiblePage }) => {
    let accessibilityScanResults;

    await test.step('Go to ODS/NHS number eligibility page', async () => {
      await odsNhsNumberNotEligiblePage.goToPageAndWaitForLoading();

      accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(tagList)
        .analyze();
      accessErrors.push(
        ...(await createHtmlAccessibilityReport(
          accessibilityScanResults,
          'OdsNhsNumberNotEligiblePage',
          'OdsNhsNumberNotEligible',
          odsNhsNumberNotEligiblePage
        ))
      );
    });

    await test.step('Check accessibility errors', () => {
      expect(accessErrors).toHaveLength(0);
    });
  }
);
