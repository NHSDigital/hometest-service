import type { IHealthCheckAnswers } from '@dnhc-health-checks/shared';
import { test, expect } from '../../../fixtures/commonFixture';
import { getAlcoholAuditTestCases } from '../../../testData/alcoholAuditScoreTestData';
import {
  HealthCheckFactory,
  HealthCheckType
} from '../../../testData/healthCheck/healthCheckFactory';

let healthCheckId: string;

test.describe('Test alcohol audit score using backend API call', () => {
  test.beforeEach(
    'Creating a health check item in Db',
    async ({ dbHealthCheckService, testedUser }) => {
      const healthCheckToCreate = HealthCheckFactory.createHealthCheck(
        testedUser,
        HealthCheckType.INITIAL
      );
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

  const testCases = getAlcoholAuditTestCases();

  testCases.forEach(({ riskCategory, riskCategoryTestData, riskScore }) => {
    test(
      `Check if audit Category was updated to ${riskCategory} and audit score was updated to ${riskScore} in database`,
      {
        tag: ['@api', '@post', '@healthCheckBackend']
      },
      async ({ dbHealthCheckService, backendApiResource }) => {
        console.log(healthCheckId, riskCategoryTestData);
        const response = await backendApiResource.healthCheck.updateHealthCheck(
          healthCheckId,
          riskCategoryTestData as IHealthCheckAnswers
        );
        console.log(`POST response status code: ${response.status()}`);

        expect(response.status()).toBe(200);

        const responseSubmit =
          await backendApiResource.healthCheck.updateHealthCheck(
            healthCheckId,
            { isAlcoholSectionSubmitted: true }
          );
        console.log(`POST response status code: ${responseSubmit.status()}`);

        expect(responseSubmit.status()).toBe(200);

        const dbItem =
          await dbHealthCheckService.getHealthCheckItemById(healthCheckId);

        expect(dbItem.questionnaireScores?.auditCategory).toBe(riskCategory);
        expect(dbItem.questionnaireScores?.auditScore).toBe(riskScore);
      }
    );
  });
});
