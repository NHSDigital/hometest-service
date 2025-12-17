import { test, expect } from '../../../fixtures/commonFixture';
import { type Config, ConfigFactory } from '../../../env/config';
import { type LabOrderItem } from '../../../lib/aws/dynamoDB/DbLabOrderService';
import getAuthToken from '../../../lib/apiClients/apiAuthorizer';
import { type SessionItem } from '../../../lib/aws/dynamoDB/DbSessionService';
import JwtTokenHelper from '../../../lib/JwtTokenHelper';
import {
  getExpectedLabResultsTestDataQriskScores,
  getLabResultsTestDataLabOrder,
  getLabResults,
  LabResultsData
} from '../../../testData/labResultsTestData';
import { calculateAge } from '../../../testData/patientTestData';
import { AuditEventType } from '@dnhc-health-checks/shared';
import type { IThrivaLabResults } from '@dnhc-health-checks/shared/model/thriva-lab-results';
import {
  HealthCheckFactory,
  HealthCheckType
} from '../../../testData/healthCheck/healthCheckFactory';

const config: Config = ConfigFactory.getConfig();
const jwtTokenHelper = new JwtTokenHelper();

let ageAtCompletion: number;
let healthCheckId: string;
let sessionItem: SessionItem;
let labOrderToCreate: LabOrderItem;

test.describe('Integration tests for Lab Results API - mock', () => {
  test.setTimeout(60000);
  test.skip(config.integratedEnvironment);
  test.beforeAll(
    'Setting up patient data in Db before POST tests',
    async ({
      testedUser,
      dbSessionService,
      dbPatientService,
      dbHealthCheckService,
      dbLabOrderService
    }) => {
      const authToken = getAuthToken();
      const sessionId = jwtTokenHelper.getSessionIdFromToken(authToken);
      sessionItem = await dbSessionService.getSessionById(sessionId);

      const { dateOfBirth } = await dbPatientService.getPatientItemByNhsNumber(
        testedUser.nhsNumber
      );

      const patientDOB = dateOfBirth ?? new Date();
      ageAtCompletion = calculateAge(new Date(patientDOB));
      await dbHealthCheckService.deleteItemByNhsNumber(sessionItem.nhsNumber);

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
  test.afterAll(
    'Deleting data from Dbs after POST tests',
    async ({ dbHealthCheckService, dbLabOrderService, dbLabResultService }) => {
      await dbHealthCheckService.deleteItemById(healthCheckId);
      await dbLabResultService.deleteLabResultItemsByHealthCheckId(
        healthCheckId
      );
      await dbLabOrderService.deleteLabOrderItem(labOrderToCreate.id);
    }
  );

  test(
    'POST request, lab-results endpoint, create lab result for patient and check that qRiskScores are retrieved',
    {
      tag: ['@api', '@post', '@resultsBackend']
    },
    async ({
      dbLabResultService,
      dbAuditEvent,
      dbHealthCheckService,
      labResultsApiResource
    }) => {
      const testStartDate = new Date().toISOString();
      const labResult = getLabResults(
        LabResultsData.NewModelSucessCholesterolOnly
      );
      const labResultApiRequestBody: IThrivaLabResults = {
        orderId: 'TEST87654323',
        orderExternalReference: labOrderToCreate.id,
        resultData: labResult,
        pendingReorder: false,
        resultDate: new Date().toISOString()
      };
      const response = await labResultsApiResource.sendLabResults(
        labResultApiRequestBody
      );
      expect(response.status()).toBe(201);

      const labResultItem =
        await dbLabResultService.getLabResultByHealthCheckId(healthCheckId);
      console.log('Lab result item:', labResultItem);
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

      const lastEvent = await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
        sessionItem.nhsNumber as unknown as string,
        AuditEventType.CholesterolBloodResultReceived,
        testStartDate
      );
      expect(lastEvent).toBeTruthy();

      const qRiskScoresUpdated =
        await dbHealthCheckService.waitForRiskScoresToBeUpdatedByNhsNumber(
          sessionItem.nhsNumber,
          getExpectedLabResultsTestDataQriskScores(),
          ageAtCompletion
        );
      expect(qRiskScoresUpdated).toBeTruthy();
    }
  );
});
