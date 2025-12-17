import { test } from '../../fixtures/commonFixture';
import {
  AlcoholConsumptionSectionDataFactory,
  AlcoholConsumptionSectionDataType
} from '../../lib/flows/AlcoholConsumptionSection/AlcoholConsumptionSectionDataFactory';
import { AlcoholConsumptionSectionFlow } from '../../lib/flows/AlcoholConsumptionSection/AlcoholConsumptionSectionFlow';
import {
  HealthCheckFactory,
  HealthCheckType
} from '../../testData/healthCheck/healthCheckFactory';

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
  'Alcohol Consumption Accessibility testing',
  {
    tag: ['@accessibility', '@alcoholConsumption', '@regression']
  },
  async ({ page, taskListPage }) => {
    test.slow();
    await test.step('Go to task list page', async () => {
      await taskListPage.goToTaskListPageAndWaitForLoading();
    });

    await test.step('Run accessibility check on task list page', async () => {
      const data = new AlcoholConsumptionSectionDataFactory(
        AlcoholConsumptionSectionDataType.HEAVY_DRINKING
      ).getData();
      await new AlcoholConsumptionSectionFlow(
        data,
        page,
        true
      ).completeSection();
    });
  }
);
