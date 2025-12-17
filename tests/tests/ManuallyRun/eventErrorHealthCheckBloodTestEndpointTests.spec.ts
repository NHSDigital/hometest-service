import {
  ActivityCategory,
  LeicesterRiskCategory,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
import { test, expect } from '../../fixtures/commonFixture';
import getAuthToken from '../../lib/apiClients/apiAuthorizer';
import { type BloodTestOrder } from '../../lib/apiClients/HealthCheckModel';
import JwtTokenHelper, { type SessionItem } from '../../lib/JwtTokenHelper';
import { pauseExecutionForMiliseconds } from '../../lib/TestUtils';
import {
  HealthCheckFactory,
  HealthCheckType
} from '../../testData/healthCheck/healthCheckFactory';

const jwtTokenHelper = new JwtTokenHelper();
let healthCheckId: string;
let sessionItem: SessionItem;
let healthCheckToCreate: IHealthCheck;
const WAIT_TIME_FOR_ORDER_PLACEMENT = 3000;

// Tests can be run only on env with mocked Thriva Api
test.describe(
  'Blood Test Order API tests - event errors',
  {
    tag: ['@manual']
  },
  () => {
    test.beforeEach(
      'Resetting the health check in Db',
      async ({ dbSessionService, dbHealthCheckService, testedUser }) => {
        const authToken = getAuthToken();
        const sessionId = jwtTokenHelper.getSessionIdFromToken(authToken);
        sessionItem = await dbSessionService.getSessionById(sessionId);
        await dbHealthCheckService.deleteItemByNhsNumber(sessionItem.nhsNumber);
        healthCheckToCreate = HealthCheckFactory.createHealthCheck(
          testedUser,
          HealthCheckType.QUESTIONNAIRE_COMPLETED
        );
        healthCheckId = healthCheckToCreate.id;
      }
    );
    test.afterEach(
      'Deleting a lab order from Db after tests',
      async ({ dbLabOrderService, dbHealthCheckService }) => {
        const labOrderItem =
          await dbLabOrderService.getLabOrderByHealthCheckId(healthCheckId);
        console.log('lab order 1:', labOrderItem);
        await Promise.all(
          labOrderItem.map(async (lo) => {
            await dbLabOrderService.deleteLabOrderItem(lo.id);
          })
        );
        await dbHealthCheckService.deleteItemById(healthCheckId);
      }
    );

    test.afterAll(
      'Renaming the patient after all tests',
      async ({ dbSessionService, config }) => {
        test.skip(config.integratedEnvironment);

        await dbSessionService.updatePatientSessionDetails(
          sessionItem.sessionId,
          'given_name_1',
          'family_name_1'
        );
      }
    );

    [
      {
        scenarioDescription: 'test Lab Order Mock returns error 400',
        firstName: 'name',
        lastName: 'labOrder_error_400'
      },
      {
        scenarioDescription: 'test Lab Order Mock returns error 500',
        firstName: 'name',
        lastName: 'labOrder_error_500'
      },
      {
        scenarioDescription: 'test Lab Order Mock returns error 503',
        firstName: 'name',
        lastName: 'labOrder_error_503'
      }
    ].forEach(({ firstName, lastName, scenarioDescription }) => {
      test(
        `POST request, lab-order endpoint, should fire event ErrorBloodTestOrder when ${scenarioDescription}}`,
        { tag: ['@api', '@post', '@labOrderBackend'] },
        async ({
          dbSessionService,
          dbHealthCheckService,
          dbAuditEvent,
          backendApiResource,
          config
        }) => {
          test.skip(config.integratedEnvironment);
          test.setTimeout(300_000);
          const testStartDate = new Date().toISOString();

          await dbSessionService.updatePatientSessionDetails(
            sessionItem.sessionId,
            firstName,
            lastName
          );

          healthCheckToCreate.questionnaireScores = {
            activityCategory: ActivityCategory.Active,
            auditScore: 37,
            bmiScore: 21,
            gppaqScore: 1,
            leicesterRiskCategory: LeicesterRiskCategory.Medium,
            leicesterRiskScore: 20,
            townsendScore: null
          };
          await dbHealthCheckService.createHealthCheck(healthCheckToCreate);
          const testData: BloodTestOrder = {
            address: {
              addressLine1: '123 Main St',
              addressLine2: 'Apt 1',
              addressLine3: 'Suite 100',
              townCity: 'London',
              postcode: 'E1 7AX'
            },
            isBloodTestSectionSubmitted: true
          };

          await backendApiResource.healthCheck.orderLabTest(
            healthCheckId,
            testData
          );

          await pauseExecutionForMiliseconds(WAIT_TIME_FOR_ORDER_PLACEMENT);

          const lastEvent =
            await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
              sessionItem.nhsNumber as unknown as string,
              'ErrorBloodTestOrder',
              testStartDate,
              20,
              10000
            );
          expect(lastEvent).toBeTruthy();
        }
      );
    });
  }
);
