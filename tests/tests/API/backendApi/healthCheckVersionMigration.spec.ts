import { test, expect } from '../../../fixtures/commonFixture';
import { v4 as uuidv4 } from 'uuid';
import { dataModelVersion } from '../../../testData/partialBloodResultsE2ETestData';
import { HealthCheckBuilder } from '../../../testData/healthCheck/healthCheckBuilder';

let healthCheckId: string;
const oldVersion = '2.1.0';

test.describe('Backend API, health-checks-version-migration endpoint with an existing health check', () => {
  test.beforeEach(
    'Creating a health check item in Db',
    async ({ testedUser, dbHealthCheckService }) => {
      const healthCheckToCreate = new HealthCheckBuilder(testedUser)
        .withDataModelVersion(oldVersion)
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
    'POST request, healthCheckVersionMigration endpoint, update health check version and create version history entries',
    {
      tag: ['@api', '@post', '@healthCheckBackend']
    },
    async ({ dbHealthCheckService, backendApiResource }) => {
      const response =
        await backendApiResource.healthCheck.updateHealthCheckToLatestVersion(
          healthCheckId
        );
      console.log(`POST response status code: ${response.status()}`);
      expect(response.status()).toEqual(200);
      expect(await response.text()).toEqual('Health Check Version Updated');

      const dbItem =
        await dbHealthCheckService.getHealthCheckItemById(healthCheckId);

      expect(dbItem.dataModelVersion).toEqual(dataModelVersion.latest);
      expect(dbItem.dataModelVersionHistory).toEqual(
        expect.arrayContaining([
          {
            dataModelVersion: oldVersion,
            migrationDate: expect.any(String)
          },
          {
            dataModelVersion: '3.0.0',
            migrationDate: expect.any(String)
          }
        ])
      );
    }
  );

  test(
    'POST request, healthCheckVersionMigration endpoint, health check version already up to date',
    {
      tag: ['@api', '@post', '@healthCheckBackend']
    },
    async ({ backendApiResource }) => {
      const responseUpdateVerion =
        await backendApiResource.healthCheck.updateHealthCheckToLatestVersion(
          healthCheckId
        );

      expect(responseUpdateVerion.status()).toEqual(200);
      expect(await responseUpdateVerion.text()).toEqual(
        'Health Check Version Updated'
      );

      const responseAlreadyUpdated =
        await backendApiResource.healthCheck.updateHealthCheckToLatestVersion(
          healthCheckId
        );
      console.log(
        `POST response status code: ${responseAlreadyUpdated.status()}`
      );
      expect(responseAlreadyUpdated.status()).toEqual(200);
      expect(await responseAlreadyUpdated.text()).toEqual(
        'Health Check Version Already Up To Date'
      );
    }
  );
});

test.describe('Backend API, health-checks-version-migration endpoint with a non-existing health check', () => {
  test(
    'POST request, healthCheckVersionMigration Backend update health check version',
    {
      tag: ['@api', '@post', '@negative', '@healthCheckBackend']
    },
    async ({ backendApiResource }) => {
      const nonExistingHealthCheckId = uuidv4();
      const response =
        await backendApiResource.healthCheck.updateHealthCheckToLatestVersion(
          nonExistingHealthCheckId
        );
      console.log(`POST response status code: ${response.status()}`);
      expect(response.status()).toEqual(400);
      expect(await response.text()).toEqual(
        'Could Not Update Healthcheck Version'
      );
    }
  );
});
