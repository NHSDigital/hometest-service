import { AuditEventType, type IHealthCheck } from '@dnhc-health-checks/shared';
import { ConfigFactory, type Config } from '../../../env/config';
import { test, expect } from '../../../fixtures/commonFixture';
import getAuthToken from '../../../lib/apiClients/apiAuthorizer';
import type { LabOrderItem } from '../../../lib/aws/dynamoDB/DbLabOrderService';
import JwtTokenHelper, { type SessionItem } from '../../../lib/JwtTokenHelper';
import {
  getLabResultsTestDataLabOrder,
  getLabResults,
  LabResultsData,
  getLabResultsData
} from '../../../testData/labResultsTestData';
import {
  HealthCheckFactory,
  HealthCheckType
} from '../../../testData/healthCheck/healthCheckFactory';

const config: Config = ConfigFactory.getConfig();
const jwtTokenHelper = new JwtTokenHelper();

let healthCheckId: string;
let sessionItem: SessionItem;
let labOrderToCreate: LabOrderItem;

const setupTest = () => {
  test.beforeEach(
    'Setting up patient data in Db before POST tests',
    async ({
      testedUser,
      dbSessionService,
      dbHealthCheckService,
      dbLabOrderService
    }) => {
      const authToken = getAuthToken();
      const sessionId = jwtTokenHelper.getSessionIdFromToken(authToken);
      sessionItem = await dbSessionService.getSessionById(sessionId);

      await dbHealthCheckService.deleteItemByNhsNumber(testedUser.nhsNumber);
      const healthCheckToCreate = HealthCheckFactory.createHealthCheck(
        testedUser,
        HealthCheckType.WITH_RESULTS_TYPE_CHOLESTEROL
      );
      healthCheckId = healthCheckToCreate.id;

      await dbHealthCheckService.createHealthCheck(healthCheckToCreate);
      labOrderToCreate = getLabResultsTestDataLabOrder(healthCheckId);
      await dbLabOrderService.createLabOrder(labOrderToCreate);
    }
  );
};

const cleanupTest = () => {
  test.afterEach(
    'Deleting data from Dbs after POST tests',
    async ({ dbHealthCheckService, dbLabOrderService, dbLabResultService }) => {
      await dbHealthCheckService.deleteItemById(healthCheckId);
      await dbLabResultService.deleteLabResultItemsByHealthCheckId(
        healthCheckId
      );
      await dbLabOrderService.deleteLabOrderItem(labOrderToCreate.id);
    }
  );
};

test.describe('APIM proxy results API integration tests', () => {
  test.setTimeout(60000);
  setupTest();
  cleanupTest();

  test(
    'POST request, lab-results endpoint, create lab result for patient and check that qRiskScores are retrieved',
    {
      tag: ['@api', '@post', '@resultsBackend']
    },
    async ({
      dbLabResultService,
      dbAuditEvent,
      dbHealthCheckService,
      apimProxyApiResource
    }) => {
      test.skip(!config.integratedEnvironment);
      const testStartDate = new Date().toISOString();
      const labResult = getLabResults(
        LabResultsData.NewModelSucessCholesterolOnly
      );
      const labResultApiRequestBody = getLabResultsData(
        labResult,
        labOrderToCreate.id
      );

      await test.step('Sending lab results to the API', async () => {
        const response = await apimProxyApiResource.sendLabResults(
          labResultApiRequestBody
        );
        expect(response.status(), 'Failed to send lab results').toBe(201);
      });

      await test.step('Verifying lab result in Db and audit event', async () => {
        const labResultItem =
          await dbLabResultService.getLabResultByHealthCheckId(healthCheckId);

        expect(labResultItem[0].resultData).toEqual(
          labResultApiRequestBody.resultData
        );
        expect(labResultItem[0].orderId).toEqual(
          labResultApiRequestBody.orderExternalReference
        );
        expect(labResultItem[0].resultDate).toEqual(
          labResultApiRequestBody.resultDate
        );
        expect(labResultItem[0].fulfilmentOrderId).toEqual(
          labResultApiRequestBody.orderId
        );

        const lastEvent =
          await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
            sessionItem.nhsNumber as unknown as string,
            AuditEventType.CholesterolBloodResultReceived,
            testStartDate
          );
        expect(
          lastEvent,
          'Audit event of type CholesterolBloodResultReceived to be written'
        ).toBeTruthy();
      });

      await test.step('Verifying qRiskScores in health check', async () => {
        const healthCheck: IHealthCheck =
          await dbHealthCheckService.waitForKeyToBePresentByHealthCheckId(
            healthCheckId,
            'riskScores'
          );

        expect(healthCheck.riskScores, 'Risk scores are not set.').toBeTruthy();
        expect(
          healthCheck.riskScores?.qRiskScore,
          'QRisk is not set in the health check'
        ).toBeTruthy();
      });
    }
  );
});

test.describe('Sending results to APIM without JWT token', () => {
  test.setTimeout(60000);
  setupTest();
  cleanupTest();

  test(
    'POST request, failed authentication script',
    {
      tag: ['@api', '@post', '@resultsBackend']
    },
    async ({ apimProxyApiResource }) => {
      test.skip(!config.integratedEnvironment);
      const labResult = getLabResults(
        LabResultsData.NewModelSucessCholesterolOnly
      );
      const labResultApiRequestBody = getLabResultsData(
        labResult,
        labOrderToCreate.id
      );
      const response = await apimProxyApiResource.sendLabResultsWithoutJWT(
        labResultApiRequestBody
      );
      expect(response.status(), 'Unauthorized request did not return 401').toBe(
        401
      );
      const responseBody = (await response.json()) as {
        code: string;
        message: string;
      };
      expect(responseBody).toEqual({
        code: 'UNAUTHORIZED',
        message: 'Unauthorised'
      });
    }
  );
});
