import {
  ExerciseHours,
  WalkingPace,
  WorkActivity,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
import { test, expect } from '../../../fixtures/commonFixture';
import { Sex } from '../../../lib/enum/health-check-answers';
import { HealthCheckFactory, HealthCheckType } from '../../../testData/healthCheck/healthCheckFactory';

let healthCheckId: string;

test.describe('Backend API, health-checks endpoint', () => {
  test.beforeEach(
    'Creating a health check item in Db',
    async ({ testedUser, dbHealthCheckService }) => {
      const healthCheck = HealthCheckFactory.createHealthCheck(testedUser, HealthCheckType.INITIAL);
      healthCheckId = healthCheck.id;
      await dbHealthCheckService.createHealthCheck(healthCheck);
    }
  );

  test.afterEach(
    'Deleting a health check item from Db after tests',
    async ({ dbHealthCheckService }) => {
      await dbHealthCheckService.deleteItemById(healthCheckId);
    }
  );

  test(
    'GET health-checks by ID',
    {
      tag: ['@api', '@get', '@health-checks', '@smoke']
    },
    async ({ backendApiResource }) => {
      const response =
        await backendApiResource.healthCheck.getHealthCheckById(healthCheckId);
      const body = (await response.json()) as {
        healthCheck: IHealthCheck;
      };
      console.log(
        `Status code: ${response.status()}\nResponse body: ${JSON.stringify(body, null, 2)}`
      );
      expect(response.status()).toEqual(200);
      expect(body.healthCheck.id).toEqual(healthCheckId);
    }
  );

  test(
    'GET health-checks happy path',
    {
      tag: ['@api', '@get', '@health-checks', '@smoke']
    },
    async ({ testedUser, backendApiResource }) => {
      const response =
        await backendApiResource.healthCheck.getAllHealthChecks();
      const body = (await response.json()) as {
        healthChecks: IHealthCheck[];
      };
      console.log(
        `Status code: ${response.status()}\nResponse body: ${JSON.stringify(body, null, 2)}`
      );
      const fetchedHealthChecks: IHealthCheck[] = body.healthChecks;
      expect(fetchedHealthChecks.length > 0).toBeTruthy();

      const fetchedHealthCheck = fetchedHealthChecks.find(
        (healthCheck) => healthCheck.id === healthCheckId
      );
      expect(fetchedHealthCheck !== undefined).toBeTruthy();
      expect(
        fetchedHealthCheck?.nhsNumber === testedUser.nhsNumber
      ).toBeTruthy();
      expect(response.status()).toEqual(200);
    }
  );

  test(
    'GET request, health-checks endpoint, retrieve all health checks for patient, incorrect token',
    {
      tag: ['@api', '@get', '@health-checks']
    },
    async ({ backendApiResource }) => {
      const response =
        await backendApiResource.healthCheck.getAllHealthChecksUsingInvalidToken();
      expect(response.status(), 'Invalid token not handled properly.').toEqual(
        401
      );
    }
  );

  test(
    'POST request, healthCheckBackend update questionnaire data and check if data were updated',
    {
      tag: ['@api', '@post', '@healthCheckBackend']
    },
    async ({ dbHealthCheckService, backendApiResource }) => {
      const dataToUpdate = {
        weight: 77,
        height: 188,
        sex: Sex.Female
      };

      const response = await backendApiResource.healthCheck.updateHealthCheck(
        healthCheckId,
        dataToUpdate
      );
      console.log(`POST response status code: ${response.status()}`);
      expect(response.status()).toEqual(200);

      const dbItem =
        await dbHealthCheckService.getHealthCheckItemById(healthCheckId);
      console.log('Check if db in HealthCheck table were updated.');
      expect(dbItem.questionnaire?.sex).toEqual(dataToUpdate.sex);
      expect(dbItem.questionnaire?.height).toEqual(dataToUpdate.height);
      expect(dbItem.questionnaire?.weight).toEqual(dataToUpdate.weight);
    }
  );

  test(
    'POST request, backend API, health-checks endpoint, update questionnaire, calculate activity score',
    {
      tag: ['@api', '@post', '@healthCheckBackend']
    },
    async ({ dbHealthCheckService, backendApiResource }) => {
      const physicalActivityDataSetupResponse =
        await backendApiResource.healthCheck.updateHealthCheck(healthCheckId, {
          cycleHours: ExerciseHours.None,
          exerciseHours: ExerciseHours.None,
          gardeningHours: ExerciseHours.None,
          walkHours: ExerciseHours.None,
          walkPace: WalkingPace.SlowPace,
          houseworkHours: ExerciseHours.None,
          workActivity: WorkActivity.Unemployed,
          isPhysicalActivitySectionSubmitted: false
        });
      expect(
        physicalActivityDataSetupResponse.status(),
        'Physical activity data update failed.'
      ).toEqual(200);

      const isPhysicalActivitySectionSubmittedResponse =
        await backendApiResource.healthCheck.updateHealthCheck(healthCheckId, {
          isPhysicalActivitySectionSubmitted: true
        });
      expect(
        isPhysicalActivitySectionSubmittedResponse.status(),
        'Physical activity section submission failed'
      ).toEqual(200);

      const healthCheck =
        await dbHealthCheckService.getHealthCheckItemById(healthCheckId);
      expect(
        healthCheck.questionnaireScores?.activityCategory,
        'Physical activity category is incorrect.'
      ).toEqual('Inactive');
    }
  );
});

test(
  'POST request, backend API, health-checks endpoint, incorrect token',
  {
    tag: ['@api', '@post', '@health-checks', '@negative']
  },
  async ({ backendApiResource }) => {
    const response =
      await backendApiResource.healthCheck.initializeHealthCheckUsingInvalidToken();
    expect(response.status()).toEqual(401);
  }
);
