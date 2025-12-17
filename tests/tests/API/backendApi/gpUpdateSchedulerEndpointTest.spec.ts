import { test, expect } from '../../../fixtures/commonFixture';
import { ScheduledReason } from '../../../lib/apiClients/HealthCheckModel';
import { type GpUpdateSchedulerItem } from '../../../lib/aws/dynamoDB/DbGpUpdateSchedulerService';
import {
  HealthCheckFactory,
  HealthCheckType
} from '../../../testData/healthCheck/healthCheckFactory';

let healthCheckId: string;
let gpUpdateSchedulerItemId: string;

test.describe('Backend API, gp update scheduler endpoint', () => {
  test.describe('Gp update scheduler endpoint positive scenarios', () => {
    test.beforeEach(
      'Creating a health check item in Db',
      async ({ testedUser, dynamoDBServiceUtils }) => {
        healthCheckId =
          await dynamoDBServiceUtils.cleanHealthCheckTableAndAddHealthCheckItem(
            testedUser,
            HealthCheckFactory.createHealthCheck(
              testedUser,
              HealthCheckType.INITIAL
            )
          );
      }
    );

    test.afterEach(
      'Deleting a health check and gpScheduler item from Db after tests',
      async ({ dbHealthCheckService, dbGpUpdateSchedulerService }) => {
        await dbHealthCheckService.deleteItemById(healthCheckId);
        await dbGpUpdateSchedulerService.deleteGpUpdateSchedulerItem(
          gpUpdateSchedulerItemId
        );
      }
    );

    Object.values(ScheduledReason).forEach((scheduledReason) => {
      test(
        `POST request, create a gp update scheduler for ${scheduledReason} reason`,
        {
          tag: ['@api', '@post', '@gpUpdateScheduler']
        },
        async ({ dbGpUpdateSchedulerService, backendApiResource }) => {
          const response =
            await backendApiResource.healthCheck.createGpUpdateScheduleItem(
              healthCheckId,
              scheduledReason
            );

          console.log(`POST response status code: ${response.status()}`);
          expect(response.status()).toEqual(200);

          const responseBody = (await response.json()) as GpUpdateSchedulerItem;
          expect(responseBody.scheduleId).toBeDefined();
          gpUpdateSchedulerItemId = responseBody.scheduleId;

          const dbGpUpdateSchedulerItem: GpUpdateSchedulerItem =
            await dbGpUpdateSchedulerService.getGpUpdateSchedulerItemById(
              gpUpdateSchedulerItemId
            );
          expect(dbGpUpdateSchedulerItem.healthCheckId).toEqual(healthCheckId);
          expect(dbGpUpdateSchedulerItem.scheduleReason).toEqual(
            scheduledReason
          );
          expect(dbGpUpdateSchedulerItem.status).toEqual('New');
        }
      );
    });
  });

  test.describe('Gp update scheduler endpoint, negative scenarios', () => {
    test.beforeAll(
      'Creating a health check item in Db',
      async ({ testedUser, dynamoDBServiceUtils }) => {
        healthCheckId =
          await dynamoDBServiceUtils.cleanHealthCheckTableAndAddHealthCheckItem(
            testedUser,
            HealthCheckFactory.createHealthCheck(
              testedUser,
              HealthCheckType.INITIAL
            )
          );
      }
    );

    test.afterAll(
      'Deleting a health check and gpScheduler item from Db after tests',
      async ({ dbHealthCheckService }) => {
        await dbHealthCheckService.deleteItemById(healthCheckId);
      }
    );
    test(
      `POST request, non-existing health check`,
      {
        tag: ['@api', '@post', '@gpUpdateScheduler']
      },
      async ({ backendApiResource }) => {
        const response =
          await backendApiResource.healthCheck.createGpUpdateScheduleItem(
            'fakeHealthCheckId',
            ScheduledReason.AuditScore
          );

        console.log(`POST response status code: ${response.status()}`);
        expect(response.status()).toEqual(404);
        expect(await response.text()).toEqual('Health Check not found');
      }
    );

    test(
      `POST request, invalid scheduled reason`,
      {
        tag: ['@api', '@post', '@negative', '@gpUpdateScheduler']
      },
      async ({ backendApiResource }) => {
        const response =
          await backendApiResource.healthCheck.createGpUpdateScheduleItem(
            healthCheckId,
            'fakeReason'
          );

        console.log(`POST response status code: ${response.status()}`);
        expect(response.status()).toEqual(400);
        expect(await response.text()).toEqual('Invalid schedule reason');
      }
    );
  });
});
