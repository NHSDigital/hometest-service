import { test } from '../../fixtures/commonFixture';
import {
  EligibilitySectionDataFactory,
  EligibilitySectionDataType
} from '../../lib/flows/EligibilitySection/EligibilitySectionDataFactory';
import { EligibilitySectionFlow } from '../../lib/flows/EligibilitySection/EligibilitySectionFlow';
import {
  HealthCheckFactory,
  HealthCheckType
} from '../../testData/healthCheck/healthCheckFactory';

test.beforeEach(async ({ testedUser, dynamoDBServiceUtils, taskListPage }) => {
  await dynamoDBServiceUtils.cleanHealthCheckTableAndAddHealthCheckItem(
    testedUser,
    HealthCheckFactory.createHealthCheck(testedUser, HealthCheckType.INITIAL)
  );
  await taskListPage.goToTaskListPageAndWaitForLoading();
});

test(
  'Check Eligibility Accessibility tests',
  {
    tag: ['@accessibility', '@checkEligibility', '@regression']
  },
  async ({ page }) => {
    await test.step('Run accessibility check on eligibility section', async () => {
      const data = new EligibilitySectionDataFactory(
        EligibilitySectionDataType.ELIGIBLE_USER
      ).getData();
      await new EligibilitySectionFlow(data, page, true).completeSection();
    });
  }
);

test(
  'Check Eligibility Accessibility for not eligible user',
  {
    tag: ['@accessibility', '@checkEligibility', '@regression']
  },
  async ({ page }) => {
    const data = new EligibilitySectionDataFactory(
      EligibilitySectionDataType.NOT_ELIGIBLE_PRE_CONDITIONS_USER
    ).getData();
    await new EligibilitySectionFlow(data, page, true).completeSection();
  }
);
