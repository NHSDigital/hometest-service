import { test, expect } from '../../fixtures/commonFixture';
import AxeBuilder from '@axe-core/playwright';
import { type Result } from 'axe-core';
import {
  createHtmlAccessibilityReport,
  tagList
} from '../../lib/AccessibilityTestReportHelper';
import {
  BodyMeasurementsSectionDataFactory,
  BodyMeasurementsSectionDataType
} from '../../lib/flows/BodyMeasurementsSection/BodyMeasurementsSectionDataFactory';
import { BodyMeasurementsSectionFlow } from '../../lib/flows/BodyMeasurementsSection/BodyMeasurementsSectionFlow';
import { healthyHealthCheckQuestionnaire } from '../../testData/questionnairesTestData';
import { HealthCheckBuilder } from '../../testData/healthCheck/healthCheckBuilder';
import {
  HealthCheckFactory,
  HealthCheckType
} from '../../testData/healthCheck/healthCheckFactory';

const accessErrors: Result[] = [];
test(
  'Body measurements Accessibility testing',
  {
    tag: ['@accessibility', '@regression']
  },
  async ({ taskListPage, page, testedUser, dynamoDBServiceUtils }) => {
    await dynamoDBServiceUtils.cleanHealthCheckTableAndAddHealthCheckItem(
      testedUser,
      HealthCheckFactory.createHealthCheck(
        testedUser,
        HealthCheckType.QUESTIONNAIRE_FILLED
      )
    );

    await taskListPage.goToTaskListPageAndWaitForLoading();
    const data = new BodyMeasurementsSectionDataFactory(
      BodyMeasurementsSectionDataType.HEALTHY_BMI
    ).getData();
    await new BodyMeasurementsSectionFlow(data, page, true).completeSection();
  }
);
test('Body measurements Accessibility testing shutter screens', async ({
  taskListPage,
  bodyMeasurementPages,
  page,
  testedUser,
  dynamoDBServiceUtils
}) => {
  let accessibilityScanResults;
  await test.step('Go to diabetes shutter page after log in, when patient has health symptoms', async () => {
    const healthCheckToCreate = new HealthCheckBuilder(testedUser)
      .withQuestionnaire(
        healthyHealthCheckQuestionnaire({
          hasHealthSymptoms: true
        })
      )
      .build();
    await dynamoDBServiceUtils.cleanHealthCheckTableAndAddHealthCheckItem(
      testedUser,
      healthCheckToCreate
    );

    await taskListPage.goToTaskListPage();
    await bodyMeasurementPages.diabetesShutterPage.waitUntilLoaded();
    accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(tagList)
      .analyze();
    accessErrors.push(
      ...(await createHtmlAccessibilityReport(
        accessibilityScanResults,
        'DiabetesShutterPage',
        'BodyMeasurements',
        bodyMeasurementPages.diabetesShutterPage
      ))
    );
  });
  await test.step('Check accessibility errors', () => {
    expect(accessErrors).toHaveLength(0);
  });
});
