import {
  LabTestType,
  HealthCheckSteps,
  BloodTestExpiryWritebackStatus,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
import { test, expect } from '../../../fixtures/commonFixture';
import type { LabOrderItem } from '../../../lib/aws/dynamoDB/DbLabOrderService';
import {
  getLabResults,
  getLabResultsTestDataLabOrder,
  LabResultsData,
  getLabResultsTestDataQuestionnaireScoresOverweight,
  getLabResultsData
} from '../../../testData/labResultsTestData';
import { questionnairesData } from '../../../testData/questionnairesTestData';
import { v4 as uuidv4 } from 'uuid';
import { ConfigFactory, type Config } from '../../../env/config';
import { ScheduledReason } from '../../../lib/apiClients/HealthCheckModel';
import { dataModelVersion } from '../../../testData/partialBloodResultsE2ETestData';

const config: Config = ConfigFactory.getConfig();

let healthCheckId: string;
let labOrderToCreate: LabOrderItem;

export default function pdmIntegrationTest() {
  const setupTest = (options?: {
    step?: HealthCheckSteps;
    includeResultTypes?: boolean;
  }) => {
    test.beforeEach(
      'Setting up patient data in Db before tests',
      async ({
        testedUser,
        dbHealthCheckService,
        dbLabOrderService,
        dbPatientService
      }) => {
        await dbHealthCheckService.deleteItemByNhsNumber(testedUser.nhsNumber);

        healthCheckId = uuidv4();
        const healthCheckToCreate: IHealthCheck = {
          questionnaire: questionnairesData(),
          questionnaireScores:
            getLabResultsTestDataQuestionnaireScoresOverweight(),
          ...(options?.includeResultTypes !== false && {
            resultTypes: [LabTestType.Cholesterol]
          }),
          nhsNumber: testedUser.nhsNumber,
          patientId:
            testedUser.patientId ??
            (await dbPatientService.getPatientIdByNhsNumber(
              testedUser.nhsNumber
            )),
          id: healthCheckId,
          createdAt: new Date().toISOString(),
          step: options?.step ?? HealthCheckSteps.QUESTIONNAIRE_COMPLETED,
          bloodTestExpiryWritebackStatus: BloodTestExpiryWritebackStatus.NA,
          dataModelVersion: dataModelVersion.V2_1_0,
          ageAtStart: 50
        };

        await dbHealthCheckService.createHealthCheck(healthCheckToCreate);
        labOrderToCreate = getLabResultsTestDataLabOrder(healthCheckId);
        await dbLabOrderService.createLabOrder(labOrderToCreate);
      }
    );
  };

  const cleanupTest = () => {
    test.afterEach(
      'Deleting data from Dbs after tests',
      async ({
        dbHealthCheckService,
        dbLabOrderService,
        dbLabResultService
      }) => {
        await dbHealthCheckService.deleteItemById(healthCheckId);
        await dbLabResultService.deleteLabResultItemsByHealthCheckId(
          healthCheckId
        );
        await dbLabOrderService.deleteLabOrderItem(labOrderToCreate.id);
      }
    );
  };

  test.describe(`PDM integration tests with MNS ${config.mnsIntegrationEnabled ? 'enabled' : 'disabled'}`, () => {
    test.setTimeout(60000);

    test.describe('PDM sending results tests', () => {
      setupTest();
      cleanupTest();

      test(
        'Send successful results to PDM',
        {
          tag: ['@pdm', '@integration']
        },
        async ({
          pdmCloudWatchService,
          pdmIntegrationQueueClientService,
          labResultsApiResource,
          dbMnsCommunicationLogService
        }) => {
          const labResult = getLabResults(
            LabResultsData.NewModelSucessCholesterolOnly
          );
          const labResultApiRequestBody = getLabResultsData(
            labResult,
            labOrderToCreate.id
          );
          await test.step('Sending lab results to the API', async () => {
            const response = await labResultsApiResource.sendLabResults(
              labResultApiRequestBody
            );
            console.log(labResultApiRequestBody);
            expect(
              response.status(),
              'Failed to send complete lab results'
            ).toBe(201);
          });

          await test.step('Send message to PDM SQS queue', async () => {
            const message = {
              healthCheckId: healthCheckId,
              operation: 'CompleteHealthCheck'
            };
            const response =
              await pdmIntegrationQueueClientService.sendMessage(message);
            expect(
              response.messageId,
              'Failed to send message to PDM SQS queue'
            ).toBeTruthy();
          });

          await test.step('Check PDM CloudWatch logs for successful export', async () => {
            const logs =
              await pdmCloudWatchService.waitForSuccessfulPdmLog(healthCheckId);
            expect(
              logs.some(
                (e) =>
                  typeof e.message === 'string' &&
                  e.message.includes('resources added'),
                'No success log found in PDM log group'
              )
            ).toBe(true);
          });

          if (config.mnsIntegrationEnabled) {
            await test.step('Verify MNS outbound communication message has been sent', async () => {
              const mnsMessageLog =
                await dbMnsCommunicationLogService.waitForItemByHealthCheckId(
                  healthCheckId
                );
              expect(mnsMessageLog).toBeDefined();
            });
          } else {
            await test.step('Verify that MNS flow was not triggered', async () => {
              const logs =
                await pdmCloudWatchService.waitForMnsDisabledLog(healthCheckId);
              expect(
                logs.length,
                'Expected MNS disabled log to be found'
              ).toBeGreaterThan(0);
            });
          }
        }
      );

      test(
        'Send partial results to PDM (incomplete bloods)',
        {
          tag: ['@pdm', '@integration']
        },
        async ({
          pdmIntegrationQueueClientService,
          pdmCloudWatchService,
          labResultsApiResource,
          dbMnsCommunicationLogService
        }) => {
          const labResult = getLabResults(
            LabResultsData.PartialFailureCholesterolOnlyHDLfailed
          );
          const labResultApiRequestBody = getLabResultsData(
            labResult,
            labOrderToCreate.id
          );

          await test.step('Send partial lab results', async () => {
            const response = await labResultsApiResource.sendLabResults(
              labResultApiRequestBody
            );
            expect(
              response.status(),
              'Failed to send partial lab results'
            ).toBe(201);
          });

          await test.step('Send message to PDM SQS queue', async () => {
            const message = {
              healthCheckId: healthCheckId,
              operation: 'CompleteHealthCheck'
            };
            const response =
              await pdmIntegrationQueueClientService.sendMessage(message);
            expect(
              response.messageId,
              'Failed to send message to PDM SQS queue'
            ).toBeTruthy();
          });

          await test.step('Check PDM CloudWatch logs for successful export', async () => {
            const logs =
              await pdmCloudWatchService.waitForSuccessfulPdmLog(healthCheckId);
            expect(
              logs.some(
                (e) =>
                  typeof e.message === 'string' &&
                  e.message.includes('resources added'),
                'No success log found in PDM log group'
              )
            ).toBe(true);
          });

          if (config.mnsIntegrationEnabled) {
            await test.step('Verify MNS outbound communication message has been sent', async () => {
              const mnsMessageLog =
                await dbMnsCommunicationLogService.waitForItemByHealthCheckId(
                  healthCheckId
                );
              expect(mnsMessageLog).toBeDefined();
            });
          } else {
            await test.step('Verify that MNS flow was not triggered', async () => {
              const logs =
                await pdmCloudWatchService.waitForMnsDisabledLog(healthCheckId);
              expect(
                logs.length,
                'Expected MNS disabled log to be found'
              ).toBeGreaterThan(0);
            });
          }
        }
      );
    });

    test.describe('PDM partial writeback test', () => {
      test.setTimeout(60000);
      setupTest({
        step: HealthCheckSteps.INIT,
        includeResultTypes: false
      });
      cleanupTest();

      test(
        'Send partial results to PDM (partial write back)',
        {
          tag: ['@pdm', '@integration']
        },
        async ({
          pdmIntegrationQueueClientService,
          pdmCloudWatchService,
          dbGpUpdateSchedulerService,
          dbMnsCommunicationLogService,
          nhcGpUpdateScheduleProcessorLambdaService
        }) => {
          const gpUpdateSchedulerId = uuidv4();

          await test.step('Create scheduler item with expiry reason', async () => {
            const gpUpdateSchedulerToCreate = {
              scheduleId: gpUpdateSchedulerId,
              createdAt: new Date().toISOString(),
              healthCheckId,
              scheduleReason: ScheduledReason.ExpiryQuestionnaire,
              status: 'New'
            };
            await dbGpUpdateSchedulerService.createGpSchedulerItem(
              gpUpdateSchedulerToCreate
            );
          });

          await test.step('Run GpUpdateScheduleProcessor lambda to trigger partial writeback', async () => {
            const response =
              await nhcGpUpdateScheduleProcessorLambdaService.triggerLambda();
            expect(
              response.$metadata.httpStatusCode,
              'Failed to trigger partial writeback lambda'
            ).toEqual(200);
          });

          await test.step('Send message to PDM SQS queue', async () => {
            const message = {
              healthCheckId,
              operation: 'PartialHealthCheck'
            };
            const response =
              await pdmIntegrationQueueClientService.sendMessage(message);
            expect(
              response.messageId,
              'Failed to send message to PDM SQS queue'
            ).toBeTruthy();
          });

          await test.step('Check PDM CloudWatch logs for partial writeback export', async () => {
            const logs =
              await pdmCloudWatchService.waitForSuccessfulPdmLog(healthCheckId);
            expect(
              logs.some(
                (e) =>
                  typeof e.message === 'string' &&
                  e.message.includes('resources added'),
                'Failed to find success log in PDM log group'
              )
            ).toBe(true);
          });

          if (config.mnsIntegrationEnabled) {
            await test.step('Verify MNS outbound communication message has been sent', async () => {
              const mnsMessageLog =
                await dbMnsCommunicationLogService.waitForItemByHealthCheckId(
                  healthCheckId
                );
              expect(mnsMessageLog).toBeDefined();
            });
          } else {
            await test.step('Verify that MNS flow was not triggered', async () => {
              const logs =
                await pdmCloudWatchService.waitForMnsDisabledLog(healthCheckId);
              expect(
                logs.length,
                'Expected MNS disabled log to be found'
              ).toBeGreaterThan(0);
            });
          }
        }
      );
    });
  });
}
