import { test, expect } from '../../fixtures/commonFixture';
import { type Config, ConfigFactory } from '../../env/config';
import type DbAuditEvent from '../../lib/aws/dynamoDB/DbAuditEventService';
import type DbHealthCheckService from '../../lib/aws/dynamoDB/DbHealthCheckService';
import {
  AuditEventType,
  HealthCheckSteps,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
import { getExpectedLabResultsTestDataQriskScores } from '../../testData/labResultsTestData';
import type DbLabResultService from '../../lib/aws/dynamoDB/DbLabResultService';
import {
  incompleteBloodTestCases,
  IncompleteBloodTestCases,
  questionnairesData
} from '../../testData/questionnairesTestData';
import { calculateAge } from '../../testData/patientTestData';
import { bloodOrderAdressTestData } from '../../testData/bloodOrderTestData';
import { GpEmailTestHelper } from '../../lib/email/GpEmailTestHelper';
import type { IThrivaLabResults } from '@dnhc-health-checks/shared/model/thriva-lab-results';
import { HealthCheckBuilder } from '../../testData/healthCheck/healthCheckBuilder';
import { type BaseTestUser } from '../../lib/users/BaseUser';
import type DbLabOrderService from '../../lib/aws/dynamoDB/DbLabOrderService';
import type { LabOrderItem } from '../../lib/aws/dynamoDB/DbLabOrderService';

let ageAtCompletion: number;
let healthCheckId: string;

const config: Config = ConfigFactory.getConfig();
let gpEmailTestHelper: GpEmailTestHelper;

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

incompleteBloodTestCases().forEach(
  ({
    testCase,
    labResultsTestData,
    pendingReorderStatus,
    expectedLabResultsTestDataHba1c,
    expectedLabResultsTestDataCholesterol,
    expectedBiometricScoresCholesterol,
    expectedBiometricScoresHba1c,
    verifyEmail,
    questionnaireScoresData
  }) => {
    test.describe(
      'Test cases for partial results',
      {
        tag: ['@integration']
      },
      () => {
        const testStartDate = new Date().toISOString();
        test.skip(config.integratedEnvironment);
        test.setTimeout(60000);
        test.beforeEach(
          async ({ testedUser, dbHealthCheckService, dbPatientService }) => {
            const { dateOfBirth } =
              await dbPatientService.getPatientItemByNhsNumber(
                testedUser.nhsNumber
              );
            const patientDOB = dateOfBirth ?? new Date();
            ageAtCompletion = calculateAge(new Date(patientDOB));

            const patientId = await dbPatientService.getPatientIdByNhsNumber(
              testedUser.nhsNumber
            );

            const healthCheckToCreate = new HealthCheckBuilder(testedUser)
              .withPatientId(patientId)
              .withStep(HealthCheckSteps.QUESTIONNAIRE_COMPLETED)
              .withQuestionnaire(questionnairesData())
              .withQuestionnaireScores(questionnaireScoresData)
              .build();

            healthCheckId = healthCheckToCreate.id;
            await dbHealthCheckService.createHealthCheck(healthCheckToCreate);

            if (verifyEmail !== null && verifyEmail === true) {
              gpEmailTestHelper = new GpEmailTestHelper(testedUser.nhsNumber);
              await gpEmailTestHelper.setupGpEmailTest();
              console.log('GP email test helper setup completed');
            }
          }
        );
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

            if (verifyEmail !== null && verifyEmail === true) {
              await gpEmailTestHelper.cleanupGpEmailTest(false);
            }
          }
        );

        test(
          `Partial Results test cases: ${testCase}`,
          { tag: ['@api', '@integration'] },
          async ({
            testedUser,
            dbHealthCheckService,
            dbLabOrderService,
            dbAuditEvent,
            dbLabResultService,
            dbCommunicationLogService,
            backendApiResource,
            labResultsApiResource
          }) => {
            let labResultApiRequestBody: IThrivaLabResults;
            await test.step('Place a blood test order - user journey', async () => {
              const response =
                await backendApiResource.healthCheck.orderLabTest(
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
                await dbHealthCheckService.getHealthCheckItemById(
                  healthCheckId
                );
              expect(dbItem.bloodTestOrder?.isBloodTestSectionSubmitted).toBe(
                true
              );
              expect(dbItem.step).toBe(HealthCheckSteps.LAB_ORDERS_PLACED);
              const orderDbItem = (
                await dbLabOrderService.getLabOrderByHealthCheckId(
                  healthCheckId
                )
              )[0];
              expect(orderDbItem).toBeDefined();
              if (
                testCase ===
                  IncompleteBloodTestCases.HappyPathCholesterolOnly ||
                testCase ===
                  IncompleteBloodTestCases.PartialResultsCholesterolOnlyCHOfailed ||
                testCase ===
                  IncompleteBloodTestCases.PartialResultsCholesterolOnlyHDLfailed
              ) {
                expect(orderDbItem.testTypes.length).toBe(1);
                expect(orderDbItem.testTypes[0]).toEqual('Cholesterol');
              } else {
                expect(orderDbItem.testTypes.length).toBe(2);
                expect(orderDbItem.testTypes[0]).toEqual('Cholesterol');
                expect(orderDbItem.testTypes[1]).toEqual('HbA1c');
              }
            });

            await test.step('Sending request to result API to mock Thriva behaviour', async () => {
              const labOrderToCreate =
                await dbLabOrderService.getLabOrderByHealthCheckId(
                  healthCheckId
                );
              const labResult = labResultsTestData;
              labResultApiRequestBody = {
                orderId: 'TEST87654329',
                orderExternalReference: labOrderToCreate[0].id,
                resultData: labResult,
                pendingReorder: pendingReorderStatus ?? false,
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
                  expectedLabResultsTestDataCholesterol ?? [],
                  expectedLabResultsTestDataHba1c ?? []
                );
              expect(hbA1cAndCholesterolResults).toBeTruthy();
              if (
                testCase !==
                  IncompleteBloodTestCases.HappyPathCholesterolOnly &&
                testCase !==
                  IncompleteBloodTestCases.PartialResultsCholesterolOnlyCHOfailed &&
                testCase !==
                  IncompleteBloodTestCases.PartialResultsCholesterolOnlyHDLfailed
              ) {
                const lastEventHbA1c =
                  await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
                    testedUser.nhsNumber,
                    AuditEventType.HbA1cResultReceived,
                    testStartDate
                  );
                expect(lastEventHbA1c).toBeTruthy();
              }
              const lastEventCholesterol =
                await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
                  testedUser.nhsNumber,
                  AuditEventType.CholesterolBloodResultReceived,
                  testStartDate
                );
              expect(lastEventCholesterol).toBeTruthy();
            });
            if (
              testCase !==
                IncompleteBloodTestCases.PartialResultsHbA1CAndCHOfailed &&
              testCase !==
                IncompleteBloodTestCases.PartialResultsCholesterolOnlyCHOfailed &&
              testCase !==
                IncompleteBloodTestCases.PartialResultsCholesterolOnlyHDLfailed &&
              testCase !==
                IncompleteBloodTestCases.PartialResultsHbA1CFailedAndCHOfailed
            ) {
              await test.step('Check if qRiskScores were calculated', async () => {
                const qRiskScoresUpdated =
                  await dbHealthCheckService.waitForRiskScoresToBeUpdatedByNhsNumber(
                    testedUser.nhsNumber,
                    getExpectedLabResultsTestDataQriskScores(),
                    ageAtCompletion
                  );
                expect(qRiskScoresUpdated).toBeTruthy();
              });
            }

            await test.step('Check if healthCheck item was updated', async () => {
              const healthCheckItem =
                await dbHealthCheckService.getHealthCheckItemById(
                  healthCheckId
                );
              expect(
                healthCheckItem.biometricScores?.[0].scores.cholesterol
              ).toEqual(expectedBiometricScoresCholesterol);
              expect(
                healthCheckItem.biometricScores?.[0].scores.diabetes
              ).toEqual(expectedBiometricScoresHba1c);
            });

            await test.step('Check if GP UPDATE was processed', async () => {
              const statusChanged =
                await dbHealthCheckService.waitForHealthCheckStepStatusToBeUpdatedByHealthCheckId(
                  healthCheckId,
                  HealthCheckSteps.GP_UPDATE_SUCCESS
                );
              expect(statusChanged).toBeTruthy();
            });

            if (verifyEmail !== null && verifyEmail === true) {
              await gpEmailTestHelper.verifyEmailHasBeenSent();

              await test.step('Check if item was created in the communication-log-db table', async () => {
                const communicationLogItem =
                  await dbCommunicationLogService.waitForCommunicationItemsByHealthCheckId(
                    healthCheckId
                  );

                expect(
                  communicationLogItem?.type,
                  'Communication item type is incorrect'
                ).toEqual('ResultsAll');
              });
            }
          }
        );
      }
    );
  }
);
