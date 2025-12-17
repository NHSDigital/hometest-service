import { test, expect } from '../../../fixtures/commonFixture';
import { HealthCheckBuilder } from '../../../testData/healthCheck/healthCheckBuilder';
import { questionnairesData } from '../../../testData/questionnairesTestData';

let healthCheckId: string;

test.describe('Backend API, submit questionnaire endpoint', () => {
  test(
    'POST request, health check submit questionnaire data',
    { tag: ['@api', '@post', '@health-checks'] },
    async ({ testedUser, dbHealthCheckService, backendApiResource }) => {
      const healthCheckToCreate = new HealthCheckBuilder(testedUser)
        .withQuestionnaire(questionnairesData())
        .build();
      healthCheckId = healthCheckToCreate.id;
      await dbHealthCheckService.createHealthCheck(healthCheckToCreate);
      await test.step('Submitting health check questionnaire', async () => {
        const response =
          await backendApiResource.healthCheck.submitHealthCheckQuestionnaire(
            healthCheckId
          );
        expect(response.status(), 'Submitting questionare failed.').toBe(204);
      });

      await dbHealthCheckService.deleteItemById(healthCheckId);
    }
  );
});
