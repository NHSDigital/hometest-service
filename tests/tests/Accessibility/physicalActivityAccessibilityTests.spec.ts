import { test } from '../../fixtures/commonFixture';
import {
  PhysicalActivitySectionDataFactory,
  PhysicalActivitySectionDataType
} from '../../lib/flows/PhysicalActivitySection/PhysicalActivitySectionDataFactory';
import { PhysicalActivitySectionFlow } from '../../lib/flows/PhysicalActivitySection/PhysicalActivitySectionFlow';
import {
  HealthCheckFactory,
  HealthCheckType
} from '../../testData/healthCheck/healthCheckFactory';

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
  'Check PhysicalActivity Accessibility tests',
  {
    tag: ['@accessibility', '@physicalActivity', '@regression']
  },
  async ({ page, taskListPage }) => {
    await taskListPage.goToTaskListPageAndWaitForLoading();

    const data = new PhysicalActivitySectionDataFactory(
      PhysicalActivitySectionDataType.HEALTHY_PATIENT
    ).getData();
    await new PhysicalActivitySectionFlow(data, page, true).completeSection();
  }
);
