import { test, expect } from '../../fixtures/commonFixture';
import { type Config, ConfigFactory } from '../../env/config';
import type DbAuditEvent from '../../lib/aws/dynamoDB/DbAuditEventService';
import {
  getLabResults,
  LabResultsData
} from '../../testData/labResultsTestData';
import type DbLabOrderService from '../../lib/aws/dynamoDB/DbLabOrderService';
import { v4 as uuidv4 } from 'uuid';
import {
  HealthCheckSteps,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
import { searchedPostcode } from '../../testData/deliveryAddressTestData';
import {
  PartialBloodTestScenarioType,
  partialBloodTestsE2EScenarios
} from '../../testData/partialBloodResultsE2ETestData';
import type DbLabResultService from '../../lib/aws/dynamoDB/DbLabResultService';

import type DbHealthCheckService from '../../lib/aws/dynamoDB/DbHealthCheckService';
import type DbPatientService from '../../lib/aws/dynamoDB/DbPatientService';
import { GpEmailTestHelper } from '../../lib/email/GpEmailTestHelper';
import type { LabOrderItem } from '../../lib/aws/dynamoDB/DbLabOrderService';
import type { BaseTestUser } from '../../lib/users/BaseUser';

let healthCheckId: string;

const config: Config = ConfigFactory.getConfig();
let gpEmailTestHelper: GpEmailTestHelper;

test.skip(config.integratedEnvironment);

async function prepareTestData(
  testedUser: BaseTestUser,
  healthCheckToCreate: Partial<IHealthCheck>,
  dbHealthCheckService: DbHealthCheckService,
  dbPatientService: DbPatientService
): Promise<void> {
  healthCheckId = uuidv4();
  healthCheckToCreate.nhsNumber = testedUser.nhsNumber;
  healthCheckToCreate.id = healthCheckId;
  healthCheckToCreate.patientId =
    await dbPatientService.getPatientIdByNhsNumber(testedUser.nhsNumber);

  await dbHealthCheckService.createHealthCheck(
    healthCheckToCreate as IHealthCheck
  );
}

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

partialBloodTestsE2EScenarios.forEach((scenario) => {
  test.setTimeout(240000);
  test.describe('Partial blood test results E2E tests', () => {
    test.beforeEach(
      'Clearing data before test',
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

        if (scenario.verifyEmail) {
          gpEmailTestHelper = new GpEmailTestHelper(testedUser.nhsNumber);
          await gpEmailTestHelper.setupGpEmailTest();
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

        if (scenario.verifyEmail) {
          await gpEmailTestHelper.cleanupGpEmailTest(false);
        }
      }
    );

    test(
      scenario.scenarioName,
      {
        tag: ['@ui']
      },
      async ({
        dbHealthCheckService,
        dbLabOrderService,
        dbLabResultService,
        dbPatientService,
        taskListPage,
        bloodTestPages,
        resultsPages,
        testedUser,
        labResultsApiResource
      }) => {
        await test.step('Prepare test data for user with cholesterol and diabities', async () => {
          const healthCheck: Partial<IHealthCheck> = scenario.healthCheck;
          await prepareTestData(
            testedUser,
            healthCheck,
            dbHealthCheckService,
            dbPatientService
          );
        });

        await test.step('Place a blood test order - user journey', async () => {
          await taskListPage.goToTaskListPageAndWaitForLoading();
          await taskListPage.clickOrderABloodTestKitLink();
          await bloodTestPages.orderBloodTestKitPage.waitUntilLoaded();
          await bloodTestPages.orderBloodTestKitPage.clickContinueButton();
          await bloodTestPages.findDeliveryAddressPage.waitUntilLoaded();
          await bloodTestPages.findDeliveryAddressPage.fillPostcodeFieldAndClickContinue(
            searchedPostcode
          );
          await bloodTestPages.selectDeliveryAddressPage.waitUntilLoaded();
          await bloodTestPages.selectDeliveryAddressPage.selectAddress();
          await bloodTestPages.selectDeliveryAddressPage.clickContinueButton();
          await bloodTestPages.enterPhoneNumberPage.waitUntilLoaded();
          await bloodTestPages.enterPhoneNumberPage.clickContinueButton();
          await bloodTestPages.confirmDetailsPage.waitUntilLoaded();
          await bloodTestPages.confirmDetailsPage.clickSaveAndContinueButton();
          await bloodTestPages.bloodTestOrderedPage.waitUntilLoaded();
        });

        await test.step('Check health check status is updated to LAB_ORDERS_PLACED', async () => {
          const isStatusUpdated =
            await dbHealthCheckService.waitForHealthCheckStepStatusToBeUpdatedByHealthCheckId(
              healthCheckId,
              HealthCheckSteps.LAB_ORDERS_PLACED
            );
          expect(
            isStatusUpdated,
            'Health check status is not update to LAB_ORDER_PLACED'
          ).toBe(true);
        });

        await test.step('Check if Lab order has been placed', async () => {
          const healthCheckDbItem =
            await dbHealthCheckService.getHealthCheckItemById(healthCheckId);
          expect(
            healthCheckDbItem.bloodTestOrder?.isBloodTestSectionSubmitted
          ).toBe(true);
          expect(healthCheckDbItem.step).toBe(
            HealthCheckSteps.LAB_ORDERS_PLACED
          );

          const orderDbItem = (
            await dbLabOrderService.getLabOrderByHealthCheckId(healthCheckId)
          )[0];
          expect(orderDbItem).toBeDefined();
          expect(orderDbItem.testTypes[0]).toEqual('Cholesterol');
          if (scenario.isDiabetes) {
            expect(orderDbItem.testTypes.length).toBe(2);
            expect(orderDbItem.testTypes[1]).toEqual('HbA1c');
          } else {
            expect(orderDbItem.testTypes.length).toBe(1);
          }
        });

        await test.step('Send results for lab tests', async () => {
          const labOrderToCreate =
            await dbLabOrderService.getLabOrderByHealthCheckId(healthCheckId);
          const labResult = scenario.labResults;
          const labResultApiRequestBody = {
            orderId: `thriva-${uuidv4()}`,
            orderExternalReference: labOrderToCreate[0].id,
            resultData: labResult,
            pendingReorder: scenario.pendingOrder,
            resultDate: new Date().toISOString()
          };
          const response = await labResultsApiResource.sendLabResults(
            labResultApiRequestBody
          );
          expect(response.status()).toBe(201);
        });

        await test.step(`Lab results got processed and health check status got updated to ${scenario.expectedHealthCheckStepAfterResults}`, async () => {
          const isStatusUpdated =
            await dbHealthCheckService.waitForHealthCheckStepStatusToBeUpdatedByHealthCheckId(
              healthCheckId,
              scenario.expectedHealthCheckStepAfterResults
            );
          expect(
            isStatusUpdated,
            `Health check status is not set to ${scenario.expectedHealthCheckStepAfterResults}`
          ).toBe(true);

          const labResults =
            await dbLabResultService.getLabResultByHealthCheckId(healthCheckId);
          if (scenario.isDiabetes) {
            expect(labResults.length).toBe(2);
          } else {
            expect(labResults.length).toBe(1);
          }
        });

        switch (scenario.scenarioType) {
          case PartialBloodTestScenarioType.CholesterolAndDiabetesBothParitalFailure: {
            await test.step('Incomplete results are displayed on the review page', async () => {
              await resultsPages.mainResultsPage.refreshPage();
              await resultsPages.mainResultsPage.waitUntilLoaded();

              expect(
                await resultsPages.mainResultsPage.incompleteResultsTitle.isVisible()
              ).toBe(true);
              expect(
                await resultsPages.mainResultsPage.missingCholesterolCard.isVisible()
              ).toBe(true);
              expect(
                await resultsPages.mainResultsPage.missingCholesterolCardTitle.textContent()
              ).toBe('Cholesterol - some results available');
              expect(
                await resultsPages.mainResultsPage.missingCholesterolCardText.textContent()
              ).toContain(
                'We need to know more about your cholesterol to work out your risk of heart attack or stroke in the next 10 years.'
              );
              expect(
                await resultsPages.mainResultsPage.diabetesCard.isVisible()
              ).toBe(false);
            });

            await test.step('User can view incomplete cholesterol results', async () => {
              await resultsPages.mainResultsPage.clickMissingCholesterolLink();
              await resultsPages.cholesterolResultsPage.waitUntilLoaded();

              expect(
                await resultsPages.cholesterolResultsPage.getIncompleteCholesterolResultsCardTitle()
              ).toBe('Your cholesterol levels are incomplete');
              expect(
                await resultsPages.cholesterolResultsPage.totalCholesterolUnknownCard.isVisible()
              ).toBe(true);
              expect(
                await resultsPages.cholesterolResultsPage.ratioUnknownCard.isVisible()
              ).toBe(true);
              expect(
                await resultsPages.cholesterolResultsPage.hdlUnknownCard.isVisible()
              ).toBe(false);
              await resultsPages.cholesterolResultsPage.clickBackLink();
            });
            break;
          }
          case PartialBloodTestScenarioType.CholesterolOnlyPartialFailure: {
            await test.step('Incomplete results are displayed on the review page', async () => {
              await resultsPages.mainResultsPage.refreshPage();
              await resultsPages.mainResultsPage.waitUntilLoaded();

              expect(
                await resultsPages.mainResultsPage.incompleteResultsTitle.isVisible()
              ).toBe(true);
              expect(
                await resultsPages.mainResultsPage.diabetesCard.isVisible()
              ).toBe(true);
              expect(
                await resultsPages.mainResultsPage.missingCholesterolCard.isVisible()
              ).toBe(true);
              expect(
                await resultsPages.mainResultsPage.missingCholesterolCardTitle.textContent()
              ).toBe('Cholesterol - some results available');
              expect(
                await resultsPages.mainResultsPage.missingCholesterolCardText.textContent()
              ).toContain(
                'We need to know more about your cholesterol to work out your risk of heart attack or stroke in the next 10 years.'
              );
            });

            await test.step('User can view incomplete cholesterol results', async () => {
              await resultsPages.mainResultsPage.clickMissingCholesterolLink();
              await resultsPages.cholesterolResultsPage.waitUntilLoaded();

              expect(
                await resultsPages.cholesterolResultsPage.getIncompleteCholesterolResultsCardTitle()
              ).toBe('Your cholesterol levels are incomplete');
              expect(
                await resultsPages.cholesterolResultsPage.totalCholesterolUnknownCard.isVisible()
              ).toBe(false);
              expect(
                await resultsPages.cholesterolResultsPage.ratioUnknownCard.isVisible()
              ).toBe(true);
              expect(
                await resultsPages.cholesterolResultsPage.hdlUnknownCard.isVisible()
              ).toBe(true);
              await resultsPages.cholesterolResultsPage.clickBackLink();
            });
            break;
          }
          case PartialBloodTestScenarioType.CholesterolAndDiabetesCompleteFailureToSuccess: {
            await test.step('Order confirmation page is displayed when complete failure happens', async () => {
              await bloodTestPages.bloodTestOrderedPage.waitUntilLoaded();
            });

            await test.step('Thriva resends results with success', async () => {
              const labOrderToCreate =
                await dbLabOrderService.getLabOrderByHealthCheckId(
                  healthCheckId
                );
              const labResult = getLabResults(
                LabResultsData.NewModelSucessCholesterolHbA1c
              );
              const labResultApiRequestBody = {
                orderId: `thriva-${uuidv4()}`,
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

            await test.step(`Lab results got processed and health check status got updated to GP_UPDATE_SUCCESS after resend`, async () => {
              const isStatusUpdated =
                await dbHealthCheckService.waitForHealthCheckStepStatusToBeUpdatedByHealthCheckId(
                  healthCheckId,
                  HealthCheckSteps.GP_UPDATE_SUCCESS
                );
              expect(
                isStatusUpdated,
                `Health check status is not set to GP_UPDATE_SUCCESS`
              ).toBe(true);

              const labResults =
                await dbLabResultService.getLabResultByHealthCheckId(
                  healthCheckId
                );
              if (scenario.isDiabetes) {
                expect(labResults.length).toBe(4);
              } else {
                expect(labResults.length).toBe(2);
              }
            });

            await test.step('Results page for complete with success is displayed', async () => {
              await resultsPages.mainResultsPage.refreshPage();
              await resultsPages.mainResultsPage.waitUntilLoaded();

              expect(
                await resultsPages.mainResultsPage.incompleteResultsTitle.isVisible()
              ).toBe(false);
              expect(
                await resultsPages.mainResultsPage.missingCholesterolCard.isVisible()
              ).toBe(false);
              expect(
                await resultsPages.mainResultsPage.diabetesCard.isVisible()
              ).toBe(true);
            });
            break;
          }
          case PartialBloodTestScenarioType.CholesterolAndDiabetesCompleteFailureToPartialFailure: {
            await test.step('Order confirmation page is displayed when complete failure happens', async () => {
              await bloodTestPages.bloodTestOrderedPage.waitUntilLoaded();
            });

            await test.step('Thriva resends results with partial failure', async () => {
              const labOrderToCreate =
                await dbLabOrderService.getLabOrderByHealthCheckId(
                  healthCheckId
                );
              const labResult = getLabResults(
                LabResultsData.PartialResultsHbA1CFailedAndCHOfailed
              );
              const labResultApiRequestBody = {
                orderId: `thriva-${uuidv4()}`,
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

            await test.step(`Lab results got processed and health check status got updated to GP_UPDATE_SUCCESS after resend`, async () => {
              const isStatusUpdated =
                await dbHealthCheckService.waitForHealthCheckStepStatusToBeUpdatedByHealthCheckId(
                  healthCheckId,
                  HealthCheckSteps.GP_UPDATE_SUCCESS
                );
              expect(
                isStatusUpdated,
                `Health check status is not set to GP_UPDATE_SUCCESS`
              ).toBe(true);

              const labResults =
                await dbLabResultService.getLabResultByHealthCheckId(
                  healthCheckId
                );
              if (scenario.isDiabetes) {
                expect(labResults.length).toBe(4);
              } else {
                expect(labResults.length).toBe(2);
              }
            });

            await test.step('Results page for complete with cholesterol and diabetes partial failure is displayed', async () => {
              await resultsPages.mainResultsPage.refreshPage();
              await resultsPages.mainResultsPage.waitUntilLoaded();

              expect(
                await resultsPages.mainResultsPage.incompleteResultsTitle.isVisible()
              ).toBe(true);
              expect(
                await resultsPages.mainResultsPage.missingCholesterolCard.isVisible()
              ).toBe(true);
              expect(
                await resultsPages.mainResultsPage.diabetesCard.isVisible()
              ).toBe(false);
            });
            break;
          }
          case PartialBloodTestScenarioType.CholesterolAndDiabetesCompleteFailureToCompleteFailure: {
            await test.step('Order confirmation page is displayed when complete failure happens', async () => {
              await bloodTestPages.bloodTestOrderedPage.waitUntilLoaded();
            });

            await test.step('Thriva resends results with complete failure', async () => {
              const labOrderToCreate =
                await dbLabOrderService.getLabOrderByHealthCheckId(
                  healthCheckId
                );
              const labResult = getLabResults(
                LabResultsData.CompleteFailureCholesterolHbA1c
              );
              const labResultApiRequestBody = {
                orderId: `thriva-${uuidv4()}`,
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

            await test.step(`Lab results got processed and health check status got updated to GP_UPDATE_SUCCESS after resend`, async () => {
              const isStatusUpdated =
                await dbHealthCheckService.waitForHealthCheckStepStatusToBeUpdatedByHealthCheckId(
                  healthCheckId,
                  HealthCheckSteps.GP_UPDATE_SUCCESS
                );
              expect(
                isStatusUpdated,
                `Health check status is not set to GP_UPDATE_SUCCESS`
              ).toBe(true);

              const labResults =
                await dbLabResultService.getLabResultByHealthCheckId(
                  healthCheckId
                );
              if (scenario.isDiabetes) {
                expect(labResults.length).toBe(4);
              } else {
                expect(labResults.length).toBe(2);
              }
            });

            await test.step('Order confirmation page is displayed when another complete failure happens', async () => {
              await bloodTestPages.bloodTestOrderedPage.waitUntilLoaded();
            });
            break;
          }
          default: {
            throw new Error(
              'Results page verification is not implemented for this scenario.'
            );
          }
        }

        if (scenario.verifyEmail) {
          await gpEmailTestHelper.verifyEmailHasBeenSent();
        }
      }
    );
  });
});
