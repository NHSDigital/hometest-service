import { test, expect } from '../../fixtures/commonFixture';
import { type Config, ConfigFactory } from '../../env/config';
import type DbAuditEvent from '../../lib/aws/dynamoDB/DbAuditEventService';
import type DbHealthCheckService from '../../lib/aws/dynamoDB/DbHealthCheckService';
import {
  AuditEventType,
  HealthCheckSteps,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
import type DbLabOrderService from '../../lib/aws/dynamoDB/DbLabOrderService';
import type DbLabResultService from '../../lib/aws/dynamoDB/DbLabResultService';
import {
  IncompleteBloodReorderTestCases,
  incompleteBloodTestCasesDataWithReorderStatus,
  questionnairesData
} from '../../testData/questionnairesTestData';
import { bloodOrderAdressTestData } from '../../testData/bloodOrderTestData';
// eslint-disable-next-line no-duplicate-imports
import { type LabOrderItem } from '../../lib/aws/dynamoDB/DbLabOrderService';
import type { IThrivaLabResults } from '@dnhc-health-checks/shared/model/thriva-lab-results';
import { HealthCheckBuilder } from '../../testData/healthCheck/healthCheckBuilder';
import type { BaseTestUser } from '../../lib/users/BaseUser';

let healthCheckId: string;

const config: Config = ConfigFactory.getConfig();

async function cleanupData(
  testedUser: BaseTestUser,
  dbHealthCheckService: DbHealthCheckService,
  dbLabOrderService: DbLabOrderService,
  dbLabResultService: DbLabResultService,
  dbAuditEvent: DbAuditEvent
): Promise<void> {
  const healthCheckForUser: IHealthCheck = (
    await dbHealthCheckService.getHealthCheckItemsByNhsNumber(
      testedUser.nhsNumber
    )
  )[0];

  if (healthCheckForUser !== undefined) {
    const healthCheckIdForUser = healthCheckForUser.id;
    const labOrderToDelete: LabOrderItem = (
      await dbLabOrderService.getLabOrderByHealthCheckId(healthCheckIdForUser)
    )[0];

    if (labOrderToDelete !== undefined) {
      console.log(`LAB ORDER: ${labOrderToDelete.id}`);
      await dbLabOrderService.deleteLabOrderItem(labOrderToDelete.id);
    }

    await dbLabResultService.deleteLabResultItemsByHealthCheckId(
      healthCheckIdForUser
    );
    await dbHealthCheckService.deleteItemById(healthCheckIdForUser);
    await dbAuditEvent.deleteItemByNhsNumber(testedUser.nhsNumber);
  }
}

incompleteBloodTestCasesDataWithReorderStatus().forEach(
  ({
    testCase,
    questionnaireScoresData,
    labResultsTestData,
    expectedLabResultsTestDataCholesterol,
    expectedLabResultsTestDataHba1c,
    expectedBiometricScoresCholesterol,
    expectedBiometricScoresHba1c,
    labResultsTestDataOnReorder,
    expectedLabResultsTestDataHba1cOnReorder,
    expectedLabResultsTestDataCholesterolOnReorder,
    expectedBiometricScoresCholesterolOnReorder,
    expectedBiometricScoresHba1cOnReorder
  }) => {
    test.describe(`Blood test reorder - ${testCase}`, () => {
      test.skip(config.integratedEnvironment);
      test.beforeEach(async ({ testedUser, dbHealthCheckService }) => {
        const healthCheckToCreate = new HealthCheckBuilder(testedUser)
          .withStep(HealthCheckSteps.QUESTIONNAIRE_COMPLETED)
          .withQuestionnaire(questionnairesData())
          .withQuestionnaireScores(questionnaireScoresData)
          .build();

        healthCheckId = healthCheckToCreate.id;
        await dbHealthCheckService.createHealthCheck(healthCheckToCreate);
      });
      test.afterEach(
        'Clearing data after test',
        async ({
          testedUser,
          dbHealthCheckService,
          dbLabOrderService,
          dbLabResultService,
          dbAuditEvent
        }) => {
          await cleanupData(
            testedUser,
            dbHealthCheckService,
            dbLabOrderService,
            dbLabResultService,
            dbAuditEvent
          );
        }
      );
      test(
        testCase,
        {
          tag: ['@integration']
        },
        async ({
          testedUser,
          dbHealthCheckService,
          dbLabOrderService,
          dbAuditEvent,
          dbLabResultService,
          backendApiResource,
          labResultsApiResource
        }) => {
          let labResultApiRequestBody: IThrivaLabResults;
          const testStartDate = new Date().toISOString();
          await test.step('Place a blood test order - user journey', async () => {
            const response = await backendApiResource.healthCheck.orderLabTest(
              healthCheckId,
              bloodOrderAdressTestData
            );
            console.log(`POST response status code: ${response.status()}`);

            expect(response.status()).toBe(200);
            const bloodTestOrderedAuditEvent =
              await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
                testedUser.nhsNumber,
                AuditEventType.BloodTestOrdered,
                testStartDate
              );
            expect(bloodTestOrderedAuditEvent).toBeTruthy();
          });

          await test.step('Check if Lab order has been placed', async () => {
            const dbItem =
              await dbHealthCheckService.getHealthCheckItemById(healthCheckId);
            expect(dbItem.bloodTestOrder?.isBloodTestSectionSubmitted).toBe(
              true
            );
            expect(dbItem.step).toBe(HealthCheckSteps.LAB_ORDERS_PLACED);
          });

          await test.step('All blood tests ordered failed in first order - complete failure scenario', async () => {
            const labOrderToCreate =
              await dbLabOrderService.getLabOrderByHealthCheckId(healthCheckId);
            const labResult = labResultsTestData;
            labResultApiRequestBody = {
              orderId: 'TEST87654329',
              orderExternalReference: labOrderToCreate[0].id,
              resultData: labResult,
              pendingReorder: true,
              resultDate: new Date().toISOString()
            };
            const response = await labResultsApiResource.sendLabResults(
              labResultApiRequestBody
            );
            expect(response.status()).toBe(201);
          });

          await test.step('Check if results were successfully stored in our results table', async () => {
            const orderIdResultDateFulfilmentOrderId =
              await dbLabResultService.waitForLabResultsDateOrderIdAndReferenceToBeStoredInLabResultTable(
                healthCheckId,
                labResultApiRequestBody.orderExternalReference,
                labResultApiRequestBody.resultDate,
                labResultApiRequestBody.orderId
              );
            expect(orderIdResultDateFulfilmentOrderId).toBeTruthy();
            const hbA1cAndCholesterolResults =
              await dbLabResultService.waitForLabResultsHbA1cToBeStoredInLabResultTable(
                healthCheckId,
                expectedLabResultsTestDataCholesterol,
                expectedLabResultsTestDataHba1c
              );
            expect(hbA1cAndCholesterolResults).toBeTruthy();
          });

          await test.step('Check if healthCheck item was updated', async () => {
            const healthCheckItem =
              await dbHealthCheckService.getHealthCheckItemById(healthCheckId);
            expect(healthCheckItem).toBeTruthy();
            expect(healthCheckItem.biometricScores).toBeTruthy();
            if (
              healthCheckItem !== undefined &&
              healthCheckItem.biometricScores !== undefined
            ) {
              expect(
                healthCheckItem.biometricScores[0].scores.cholesterol
              ).toEqual(expectedBiometricScoresCholesterol);
              expect(
                healthCheckItem.biometricScores[0].scores.diabetes
              ).toEqual(expectedBiometricScoresHba1c);
            }
          });
          await test.step('Expect health check item step to be "LAB_ORDERS_PLACED" when complete failure scenario occure', async () => {
            const statusChanged =
              await dbHealthCheckService.waitForHealthCheckStepStatusToBeUpdatedByHealthCheckId(
                healthCheckId,
                HealthCheckSteps.LAB_ORDERS_PLACED
              );
            expect(statusChanged).toBeTruthy();
            const orderDbItem = (
              await dbLabOrderService.getLabOrderByHealthCheckId(healthCheckId)
            )[0];
            expect(orderDbItem).toBeDefined();
            if (
              testCase ===
                IncompleteBloodReorderTestCases.HappyPathCholesterolOnly ||
              testCase ===
                IncompleteBloodReorderTestCases.PartialResultsCholesterolOnlyCHOfailed ||
              testCase ===
                IncompleteBloodReorderTestCases.DoubleFailureCholesterolOnlyCase
            ) {
              expect(orderDbItem.testTypes.length).toBe(1);
              expect(orderDbItem.testTypes[0]).toEqual('Cholesterol');
            } else {
              expect(orderDbItem.testTypes.length).toBe(2);
              expect(orderDbItem.testTypes[0]).toEqual('Cholesterol');
              expect(orderDbItem.testTypes[1]).toEqual('HbA1c');
            }
          });
          await test.step('All blood tests ordered are successful in second order', async () => {
            const labOrderToCreate =
              await dbLabOrderService.getLabOrderByHealthCheckId(healthCheckId);
            const labResult = labResultsTestDataOnReorder;
            labResultApiRequestBody = {
              orderId: 'TEST87654329',
              orderExternalReference: labOrderToCreate[0].id,
              resultData: labResult,
              pendingReorder: false,
              resultDate: new Date().toISOString()
            };
            const response = await labResultsApiResource.sendLabResults(
              labResultApiRequestBody
            );
            expect(response.status()).toBe(201);
          });
          await test.step('Check if results were successfully stored in our results table', async () => {
            const orderIdResultDateFulfilmentOrderId =
              await dbLabResultService.waitForLabResultsDateOrderIdAndReferenceToBeStoredInLabResultTable(
                healthCheckId,
                labResultApiRequestBody.orderExternalReference,
                labResultApiRequestBody.resultDate,
                labResultApiRequestBody.orderId
              );
            expect(orderIdResultDateFulfilmentOrderId).toBeTruthy();

            const hbA1cAndCholesterolResults =
              await dbLabResultService.waitForLabResultsHbA1cToBeStoredInLabResultTable(
                healthCheckId,
                expectedLabResultsTestDataCholesterolOnReorder ?? [],
                expectedLabResultsTestDataHba1cOnReorder ?? []
              );
            expect(hbA1cAndCholesterolResults).toBeTruthy();
          });

          await test.step('Check if healthCheck item was updated', async () => {
            const healthCheckItem =
              await dbHealthCheckService.getHealthCheckItemById(healthCheckId);
            expect(healthCheckItem).toBeTruthy();
            expect(healthCheckItem.biometricScores).toBeTruthy();
            if (
              healthCheckItem !== undefined &&
              healthCheckItem.biometricScores !== undefined
            ) {
              expect(
                healthCheckItem.biometricScores[1].scores.cholesterol
              ).toEqual(expectedBiometricScoresCholesterolOnReorder);
              expect(
                healthCheckItem.biometricScores[1].scores.diabetes
              ).toEqual(expectedBiometricScoresHba1cOnReorder);
            }
          });

          await test.step('Expect health check processing to be initialized after receiving final blood tests results', async () => {
            const statusChanged =
              await dbHealthCheckService.waitForHealthCheckStepStatusToBeUpdatedByHealthCheckId(
                healthCheckId,
                HealthCheckSteps.GP_UPDATE_SUCCESS
              );
            expect(statusChanged).toBeTruthy();
          });
        }
      );
    });
  }
);
