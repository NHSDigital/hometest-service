import { test, expect } from '../../../fixtures/commonFixture';
import {
  getLeicesterDiabetesRiskScoreBasedOnRiskCategory,
  RiskCategoryValues
} from '../../../testData/leicesterDiabetesRiskScoreTestData';
import { type IHealthCheckAnswers } from '@dnhc-health-checks/shared';
import { HealthCheckBuilder } from '../../../testData/healthCheck/healthCheckBuilder';

let healthCheckId: string;
let riskCategoryInDb: string | null;

const testCases = [
  {
    riskCategory: RiskCategoryValues.INCOMPLETE
  },
  {
    riskCategory: RiskCategoryValues.LOW
  },
  {
    riskCategory: RiskCategoryValues.MEDIUM
  },
  {
    riskCategory: RiskCategoryValues.HIGH
  },
  {
    riskCategory: RiskCategoryValues.VERY_HIGH
  }
];

testCases.forEach(({ riskCategory }) => {
  test.describe('Check leicester Diabetes Category using backend API call', () => {
    test.beforeEach(
      'Creating a health check item in Db',
      async ({ testedUser, dbHealthCheckService }) => {
        const questionnaire = getLeicesterDiabetesRiskScoreBasedOnRiskCategory(
          riskCategory,
          testedUser.age as number
        );
        const healthCheckToCreate = new HealthCheckBuilder(testedUser)
          .withQuestionnaire(questionnaire)
          .build();
        healthCheckId = healthCheckToCreate.id;
        await dbHealthCheckService.createHealthCheck(healthCheckToCreate);
      }
    );

    test.afterEach(
      'Deleting a health check item from Db after tests',
      async ({ dbHealthCheckService }) => {
        await dbHealthCheckService.deleteItemById(healthCheckId);
      }
    );

    test(
      `Check if leicesterRiskCategory was updated to ${riskCategory} and score is in database`,
      {
        tag: ['@api', '@post', '@healthCheckBackend']
      },
      async ({ testedUser, dbHealthCheckService, backendApiResource }) => {
        test.skip(
          (testedUser.age as unknown as number) > 59 &&
          riskCategory === RiskCategoryValues.LOW
        );
        const response = await backendApiResource.healthCheck.updateHealthCheck(
          healthCheckId,
          getLeicesterDiabetesRiskScoreBasedOnRiskCategory(
            riskCategory,
            testedUser.age as unknown as number
          ) as IHealthCheckAnswers
        );
        console.log(`POST response status code: ${response.status()}`);

        expect(response.status()).toEqual(200);

        riskCategoryInDb =
          riskCategory === RiskCategoryValues.INCOMPLETE ? null : riskCategory;
        const dbItem =
          await dbHealthCheckService.getHealthCheckItemById(healthCheckId);
        expect(dbItem.questionnaireScores?.leicesterRiskCategory).toEqual(
          riskCategoryInDb
        );
      }
    );
  });
});
