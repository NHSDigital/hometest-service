import { test, expect } from '../../../fixtures/commonFixture';

test.describe('Backend API, create health-check', () => {
  test.beforeEach(
    'Clear patient data and reauthenticate',
    async ({ dbHealthCheckService, testedUser }) => {
      await dbHealthCheckService.deleteItemByNhsNumber(testedUser.nhsNumber);
    }
  );

  test.afterEach(
    'Deleting patient health checks from Db after POST tests',
    async ({ dbHealthCheckService, testedUser }) => {
      await dbHealthCheckService.deleteItemByNhsNumber(testedUser.nhsNumber);
    }
  );

  test(
    'POST request, health-checks endpoint, create and initiate health check for patient and make sure that only one health check can be created for a user',
    {
      tag: ['@api', '@post', '@health-checks, @smoke']
    },
    async ({ dbHealthCheckService, testedUser, backendApiResource }) => {
      await test.step('Initiate health check for user', async () => {
        const testStartDate = new Date().toISOString();

        console.log(
          `HealthCheckData in DB: ${JSON.stringify(
            await dbHealthCheckService.getHealthCheckItemsByNhsNumber(
              testedUser.nhsNumber
            )
          )}`
        );

        const response =
          await backendApiResource.healthCheck.initializeHealthCheck();
        console.log(`Response: ${JSON.stringify(response)}`);
        expect(response.status()).toEqual(200);

        console.log(`Status code: ${response.status()}`);

        const healthCheckItem =
          await dbHealthCheckService.getLatestHealthCheckItemsByNhsNumber(
            testedUser.nhsNumber
          );

        if (!healthCheckItem) {
          throw Error('health check doesnt exist');
        }

        expect(healthCheckItem?.createdAt > testStartDate).toBeTruthy();
        expect(healthCheckItem?.step).toEqual('INIT');
        expect(healthCheckItem?.nhsNumber).toEqual(testedUser.nhsNumber);
      });

      await test.step('Cannot create a second health check', async () => {
        const secondResponse =
          await backendApiResource.healthCheck.initializeHealthCheck();
        expect(secondResponse.status()).toEqual(500);
      });
    }
  );
});
