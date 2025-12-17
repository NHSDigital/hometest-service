import { AuditEventType, type IHealthCheck } from '@dnhc-health-checks/shared';
import { ConfigFactory, type Config } from '../../../env/config';
import { test, expect } from '../../../fixtures/commonFixture';
import type { LabOrderItem } from '../../../lib/aws/dynamoDB/DbLabOrderService';
import JwtTokenHelper, { type SessionItem } from '../../../lib/JwtTokenHelper';
import {
  getLabResultsTestDataLabOrder,
  getLabResults,
  LabResultsData,
  getLabResultsData
} from '../../../testData/labResultsTestData';
import getAuthToken from '../../../lib/apiClients/apiAuthorizer';
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
      dbHealthCheckService,
      dbLabOrderService,
      dbSessionService
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

test.describe('Integration tests for mTLS results API', () => {
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
      mtlsResultsApiResource
    }) => {
      const testStartDate = new Date().toISOString();
      const labResult = getLabResults(
        LabResultsData.NewModelSucessCholesterolOnly
      );
      const labResultApiRequestBody = getLabResultsData(
        labResult,
        labOrderToCreate.id
      );

      await test.step('Sending lab results to the API', async () => {
        const response = await mtlsResultsApiResource.sendLabResults(
          labResultApiRequestBody
        );
        console.log(labResultApiRequestBody);
        expect(response.status()).toBe(201);
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
        expect(lastEvent).toBeTruthy();
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

test.describe('No certificate for mTLS results API', () => {
  test.setTimeout(60000);
  test.use({
    clientCertificates: []
  });

  setupTest();
  cleanupTest();

  test(
    'POST request, no certificate',
    {
      tag: ['@api', '@post', '@resultsBackend']
    },
    async ({ mtlsResultsApiResource }) => {
      const labResult = getLabResults(
        LabResultsData.NewModelSucessCholesterolOnly
      );
      const labResultApiRequestBody = getLabResultsData(
        labResult,
        labOrderToCreate.id
      );

      await expect(async () => {
        await mtlsResultsApiResource.sendLabResults(labResultApiRequestBody);
      }).rejects.toThrowError();
    }
  );
});

test.describe('Invalid certificate for mTLS results API', () => {
  test.setTimeout(60000);
  test.use({
    clientCertificates: [
      {
        origin: config.mtlsResultsApiUrl,
        certPath: config.mtlsInvalidCertificatePath,
        keyPath: config.mtlsInvalidKeyPath,
        passphrase: config.mtlsPassphrase
      }
    ]
  });

  setupTest();
  cleanupTest();

  test(
    'POST request, invalid certificate',
    {
      tag: ['@api', '@post', '@resultsBackend']
    },
    async ({ mtlsResultsApiResource }) => {
      const labResult = getLabResults(
        LabResultsData.NewModelSucessCholesterolOnly
      );
      const labResultApiRequestBody = getLabResultsData(
        labResult,
        labOrderToCreate.id
      );

      const response = await mtlsResultsApiResource.sendLabResults(
        labResultApiRequestBody
      );
      expect(
        response.status(),
        'Invalid response code for invalid cerificate'
      ).toBe(403);
    }
  );
});
