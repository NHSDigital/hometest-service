import { test, expect } from '../../../fixtures/commonFixture';
import { type BloodTestOrder } from '../../../lib/apiClients/HealthCheckModel';
import JwtTokenHelper from '../../../lib/JwtTokenHelper';
import getAuthToken from '../../../lib/apiClients/apiAuthorizer';
import { type SessionItem } from '../../../lib/aws/dynamoDB/DbSessionService';
import { pauseExecutionForMiliseconds } from '../../../lib/TestUtils';
import {
  ActivityCategory,
  LabTestType,
  LeicesterRiskCategory,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
import {
  HealthCheckFactory,
  HealthCheckType
} from '../../../testData/healthCheck/healthCheckFactory';

const jwtTokenHelper = new JwtTokenHelper();
let healthCheckId: string;
let sessionItem: SessionItem;
let healthCheckToCreate: IHealthCheck;
const WAIT_TIME_FOR_ORDER_PLACEMENT = 3000;

test.describe('Blood Test Order API tests', () => {
  test.beforeEach(
    'Resetting the health check in Db',
    async ({ dbSessionService, dbHealthCheckService, testedUser }) => {
      const authToken = getAuthToken();
      const sessionId = jwtTokenHelper.getSessionIdFromToken(authToken);
      sessionItem = await dbSessionService.getSessionById(sessionId);
      console.log(`BEFORE: `);
      await dbHealthCheckService.deleteItemByNhsNumber(sessionItem.nhsNumber);

      healthCheckToCreate = HealthCheckFactory.createHealthCheck(
        testedUser,
        HealthCheckType.QUESTIONNAIRE_COMPLETED
      );
      healthCheckId = healthCheckToCreate.id;
      await dbHealthCheckService.createHealthCheck(healthCheckToCreate);
    }
  );
  test.afterEach(
    'Deleting a lab order from Db after tests',
    async ({ dbLabOrderService, dbHealthCheckService, dbSessionService }) => {
      const labOrderItem =
        await dbLabOrderService.getLabOrderByHealthCheckId(healthCheckId);
      console.log('lab order 1:', labOrderItem);
      await Promise.all(
        labOrderItem.map(async (lo) => {
          await dbLabOrderService.deleteLabOrderItem(lo.id);
        })
      );
      await dbHealthCheckService.deleteItemById(healthCheckId);

      await dbSessionService.updatePatientSessionDetails(
        sessionItem.sessionId,
        sessionItem.firstName,
        sessionItem.lastName
      );
    }
  );

  [
    {
      questionnaireScores: {
        activityCategory: ActivityCategory.Active,
        auditScore: 37,
        bmiScore: 21,
        gppaqScore: 1,
        leicesterRiskCategory: LeicesterRiskCategory.Medium,
        leicesterRiskScore: 10,
        townsendScore: null
      },
      testTypes: [LabTestType.Cholesterol]
    },
    {
      questionnaireScores: {
        activityCategory: ActivityCategory.Active,
        auditScore: 37,
        bmiScore: 21,
        gppaqScore: 1,
        leicesterRiskCategory: LeicesterRiskCategory.Medium,
        leicesterRiskScore: 20,
        townsendScore: null
      },
      testTypes: [LabTestType.Cholesterol, LabTestType.HbA1c]
    }
  ].forEach(({ questionnaireScores, testTypes }) => {
    test(
      `POST request, lab-order endpoint, should place the lab order successfully with leicesterRiskScore ${questionnaireScores.leicesterRiskScore}`,
      { tag: ['@api', '@post', '@labOrderBackend'] },
      async ({
        dbHealthCheckService,
        dbLabOrderService,
        dbAuditEvent,
        backendApiResource
      }) => {
        healthCheckToCreate.questionnaireScores = questionnaireScores;
        await dbHealthCheckService.createHealthCheck(healthCheckToCreate);
        console.log(
          await dbHealthCheckService.getHealthCheckItemById(healthCheckId)
        );
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
        const testStartDate = new Date().toISOString();

        console.log(JSON.stringify(testData, null, 2));

        const response = await backendApiResource.healthCheck.orderLabTest(
          healthCheckId,
          testData
        );

        console.log(`POST response status code: ${response.status()}`);

        expect(response.status()).toBe(200);
        await pauseExecutionForMiliseconds(WAIT_TIME_FOR_ORDER_PLACEMENT);

        const dbItem =
          await dbHealthCheckService.getHealthCheckItemById(healthCheckId);
        expect(dbItem.bloodTestOrder?.isBloodTestSectionSubmitted).toBe(true);
        expect(dbItem.bloodTestOrder?.address).toEqual(testData.address);
        expect(dbItem.step).toBe('LAB_ORDERS_PLACED');
        const dbLabOrderItem =
          await dbLabOrderService.getLabOrderByHealthCheckId(healthCheckId);
        expect(dbLabOrderItem.length).toBe(1);
        expect(dbLabOrderItem[0].deliveryAddress).toEqual(testData.address);
        expect(dbLabOrderItem[0].testTypes).toStrictEqual(testTypes);
        expect(dbLabOrderItem[0].fulfilmentOrderId).not.toBeNull();
        const lastEvent =
          await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
            sessionItem.nhsNumber as unknown as string,
            'BloodTestOrdered',
            testStartDate
          );
        expect(lastEvent).toBeTruthy();
      }
    );
  });

  test('POST request, lab-order endpoint, should not call the api when there is an exisiting order for healthcheck', async ({
    dbHealthCheckService,
    backendApiResource
  }) => {
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
    const response = await backendApiResource.healthCheck.orderLabTest(
      healthCheckId,
      testData
    );

    expect(response.status()).toBe(200);
    const secondCallToApiResponse =
      await backendApiResource.healthCheck.orderLabTest(
        healthCheckId,
        testData
      );

    expect(secondCallToApiResponse.status()).toBe(400);
  });
  [
    {
      scenarioDescription: 'first name exceeds the length limit',
      firstName: 'VeryLongFirstNameExceedingTheLimit',
      lastName: 'ShortLastName'
    },
    {
      scenarioDescription: 'last name exceeds the length limit',
      firstName: 'ShortFirstName',
      lastName: 'VeryLongLastNameExceedingTheLimit'
    }
  ].forEach(({ firstName, lastName, scenarioDescription }) => {
    test(
      `POST request, lab-order endpoint, should place the lab order successfully and truncate name when ${scenarioDescription}}`,
      { tag: ['@api', '@post', '@labOrderBackend'] },
      async ({
        dbSessionService,
        dbHealthCheckService,
        dbLabOrderService,
        config,
        backendApiResource
      }) => {
        test.skip(config.integratedEnvironment);

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
        const response = await backendApiResource.healthCheck.orderLabTest(
          healthCheckId,
          testData
        );

        expect(response.status()).toBe(200);

        await pauseExecutionForMiliseconds(WAIT_TIME_FOR_ORDER_PLACEMENT);

        const dbItem =
          await dbHealthCheckService.getHealthCheckItemById(healthCheckId);
        expect(dbItem.step).toBe('LAB_ORDERS_PLACED');
        const dbLabOrderItem =
          await dbLabOrderService.getLabOrderByHealthCheckId(healthCheckId);
        expect(dbLabOrderItem[0].fulfilmentOrderId).not.toBeNull();
      }
    );
  });
});
