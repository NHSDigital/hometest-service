import { test, expect } from '../../fixtures/commonFixture';
import AxeBuilder from '@axe-core/playwright';
import { type Result } from 'axe-core';
import {
  createHtmlAccessibilityReport,
  tagList
} from '../../lib/AccessibilityTestReportHelper';
import { HealthCheckSteps } from '@dnhc-health-checks/shared';
import { HealthCheckBuilder } from '../../testData/healthCheck/healthCheckBuilder';

let healthCheckId: string;

const accessErrors: Result[] = [];

test.beforeEach(async ({ testedUser, dynamoDBServiceUtils }) => {
  const healthCheckToCreate = new HealthCheckBuilder(testedUser)
    .withStep(HealthCheckSteps.AUTO_EXPIRED)
    .withExpiredAt(new Date().toISOString())
    .build();
  healthCheckId = healthCheckToCreate.id;
  await dynamoDBServiceUtils.dbHealthCheckService.createHealthCheck(
    healthCheckToCreate
  );
});

test.afterEach(async ({ dbHealthCheckService }) => {
  await dbHealthCheckService.deleteItemById(healthCheckId);
});

test(
  'Health Check expired screen Accessibility tests',
  {
    tag: ['@accessibility', '@regression']
  },
  async ({ page, healthCheckExpiredPage }) => {
    let accessibilityScanResults;

    await test.step('Go to HealthCheckExpiredPage', async () => {
      await healthCheckExpiredPage.goToPageAndWaitForLoading();

      accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(tagList)
        .analyze();
      accessErrors.push(
        ...(await createHtmlAccessibilityReport(
          accessibilityScanResults,
          'HealthCheckExpiredPage',
          undefined,
          healthCheckExpiredPage
        ))
      );
    });

    await test.step('Check accessibility errors', () => {
      expect(accessErrors).toHaveLength(0);
    });
  }
);
