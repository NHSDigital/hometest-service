import { test, expect } from '../../../fixtures/commonFixture';
import { type Config, ConfigFactory } from '../../../env/config';
import { type GpUpdateSchedulerItem } from '../../../lib/aws/dynamoDB/DbGpUpdateSchedulerService';
import { v4 as uuidv4 } from 'uuid';
import {
  healthyHealthCheckQuestionnaire,
  healthyHealthCheckQuestionnaireScores,
  healthyHealthCheckRiskScores
} from '../../../testData/questionnairesTestData';
import { partialWriteBackTestCases } from '../../../testData/partialWriteBackSchedulerTestData';
import {
  AuditEventType,
  BloodTestExpiryWritebackStatus,
  HealthCheckSteps,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
import {
  getPatientDbItem,
  getRandomNhsNumber
} from '../../../testData/patientTestData';
import { type PatientItem } from '../../../lib/aws/dynamoDB/DbPatientService';
import { ScheduledReason } from '../../../lib/apiClients/HealthCheckModel';
import { dataModelVersion } from '../../../testData/partialBloodResultsE2ETestData';
import { HealthCheckBuilder } from '../../../testData/healthCheck/healthCheckBuilder';

const config: Config = ConfigFactory.getConfig();

let healthCheckId: string;
let gpUpdateSchedulerId: string;
let testedNhsNumber: string;
let testPatient: PatientItem;
let healthCheckToCreate: IHealthCheck;
let gpUpdateSchedulerToCreate: GpUpdateSchedulerItem;
let gpUpdateSchedulerItems: GpUpdateSchedulerItem[];
let scheduledReasonList: ScheduledReason[];
let ruleName: string;

export default function partialWriteBackIntegrationTest(): void {
  partialWriteBackTestCases().forEach(
    ({
      testQuestionnaire,
      testQuestionnaireScores,
      testSchedulerReason,
      expectedSchedulerChanges,
      expectedSchedulerDelete,
      followUpValue,
      description
    }) => {
      test.describe(`Partial write-back - processing scheduled tasks`, () => {
        test.skip(
          config.emisMock === false,
          'Only runs on environments with Emis Mock Api deployed'
        );
        test.beforeAll(
          'Disabling EventBridge lambda trigger and cleaning up scheduler db',
          async ({ eventBridgeService }) => {
            ruleName = await eventBridgeService.getRuleName('nhc-gp-partial');
            await eventBridgeService.disableEventBridgeRule(ruleName);
          }
        );

        test.beforeEach(
          'Creating a health check and scheduler item in Db',
          async ({
            dbAuditEvent,
            dbHealthCheckService,
            dbPatientService,
            dbGpUpdateSchedulerService
          }) => {
            testedNhsNumber = getRandomNhsNumber();
            testPatient = getPatientDbItem(testedNhsNumber);
            healthCheckId = uuidv4();
            gpUpdateSchedulerId = uuidv4();

            healthCheckToCreate = new HealthCheckBuilder(testPatient)
              .withId(healthCheckId)
              .withQuestionnaireCompletionDate(new Date().toISOString())
              .withStep(HealthCheckSteps.INIT)
              .withQuestionnaire(testQuestionnaire)
              .withQuestionnaireScores(testQuestionnaireScores)
              .withRiskScores(healthyHealthCheckRiskScores())
              .withBloodTestExpiryWritebackStatus(
                BloodTestExpiryWritebackStatus.NA
              )
              .build();
            console.log('Created Health Check:', healthCheckToCreate);

            gpUpdateSchedulerToCreate = {
              scheduleId: gpUpdateSchedulerId,
              createdAt: healthCheckToCreate.createdAt,
              healthCheckId,
              scheduleReason: testSchedulerReason,
              status: 'New'
            };

            await dbAuditEvent.deleteItemByNhsNumber(testedNhsNumber);
            await dbHealthCheckService.createHealthCheck(healthCheckToCreate);
            await dbPatientService.createPatient(testPatient);

            await dbGpUpdateSchedulerService.createGpSchedulerItem(
              gpUpdateSchedulerToCreate
            );
          }
        );

        test.afterEach(
          'Deleting a health check and scheduler item from Db after tests',
          async ({
            dbAuditEvent,
            dbHealthCheckService,
            dbPatientService,
            dbGpUpdateSchedulerService
          }) => {
            await dbHealthCheckService.deleteItemById(healthCheckId);
            await dbPatientService.deletePatientItemByNhsNumber(
              testedNhsNumber
            );
            await dbAuditEvent.deleteItemByNhsNumber(testedNhsNumber);
            await dbGpUpdateSchedulerService.deleteGpUpdateSchedulerItemByHealthCheckId(
              healthCheckId
            );
          }
        );

        test.afterAll(
          'Enabling EventBridge lambda trigger',
          async ({ eventBridgeService }) => {
            await eventBridgeService.enableEventBridgeRule(ruleName);
          }
        );

        test(
          `Partial write-back for test case - ${description}`,
          {
            tag: ['@integration', '@partial-write-back']
          },
          async ({
            nhcGpUpdateScheduleProcessorLambdaService,
            dbAuditEvent,
            dbGpUpdateSchedulerService
          }) => {
            test.slow();
            const testStartDate = new Date().toISOString();

            await test.step('Check if GpUpdateScheduleProcessor lambda was run successfully', async () => {
              const response =
                await nhcGpUpdateScheduleProcessorLambdaService.triggerLambda();
              expect(response.$metadata.httpStatusCode).toEqual(200);
            });

            await test.step('Check if events were created after running GpUpdateScheduleProcessor lambda', async () => {
              if (expectedSchedulerChanges) {
                const lastMessage =
                  await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
                    healthCheckToCreate.nhsNumber as unknown as string,
                    AuditEventType.IncompleteDNHCWrittenToGp,
                    testStartDate
                  );
                expect(lastMessage).toBeTruthy();
                expect(lastMessage?.details?.reasons).toContain(
                  testSchedulerReason
                );
                expect(lastMessage?.details?.followUp).toEqual(followUpValue);
                expect(lastMessage?.healthCheckId).toEqual(healthCheckId);
              }

              if (expectedSchedulerDelete) {
                const lastMessage =
                  await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
                    testedNhsNumber,
                    AuditEventType.IncompleteDNHCNotRequired,
                    testStartDate
                  );
                expect(lastMessage).toBeTruthy();
              }
            });

            await test.step('Check if schedule item was removed after successful', async () => {
              const gpUpdateSchedulerItems =
                await dbGpUpdateSchedulerService.getGpUpdateSchedulerItemsByHealthCheckId(
                  healthCheckId
                );
              expect(gpUpdateSchedulerItems.length).toEqual(0);
            });
          }
        );
      });
    }
  );

  test.describe(`Partial write-back - processing multiple schedule tasks for single health check`, () => {
    test.skip(
      config.emisMock === false,
      'Only runs on environments with Emis Mock Api deployed'
    );
    test.beforeEach(
      'Creating a health check and schedule items in Db',
      async ({
        dbAuditEvent,
        dbHealthCheckService,
        dbPatientService,
        dbGpUpdateSchedulerService
      }) => {
        testedNhsNumber = getRandomNhsNumber();
        testPatient = getPatientDbItem(testedNhsNumber);
        healthCheckId = uuidv4();

        healthCheckToCreate = new HealthCheckBuilder(testPatient)
          .withId(healthCheckId)
          .withNhsNumber(testedNhsNumber)
          .withPatientId(testPatient.patientId ?? '')
          .withCreatedAt(new Date().toISOString())
          .withQuestionnaireCompletionDate(new Date().toISOString())
          .withStep(HealthCheckSteps.INIT)
          .withQuestionnaire(healthyHealthCheckQuestionnaire())
          .withQuestionnaireScores(healthyHealthCheckQuestionnaireScores())
          .withRiskScores(healthyHealthCheckRiskScores())
          .withBloodTestExpiryWritebackStatus(BloodTestExpiryWritebackStatus.NA)
          .withDataModelVersion(dataModelVersion.V2_1_0)
          .withAgeAtStart(50)
          .build();

        await dbAuditEvent.deleteItemByNhsNumber(testedNhsNumber);
        await dbHealthCheckService.createHealthCheck(healthCheckToCreate);
        await dbPatientService.createPatient(testPatient);

        scheduledReasonList = [
          ScheduledReason.BloodResultOutstanding,
          ScheduledReason.ExpiryQuestionnaire,
          ScheduledReason.UrgentHighBP
        ];
        for (const scheduleReason of scheduledReasonList) {
          gpUpdateSchedulerToCreate = {
            scheduleId: uuidv4(),
            createdAt: healthCheckToCreate.createdAt,
            healthCheckId,
            scheduleReason,
            status: 'New'
          };
          await dbGpUpdateSchedulerService.createGpSchedulerItem(
            gpUpdateSchedulerToCreate
          );
        }
      }
    );

    test.afterEach(
      'Deleting a health check and scheduler item from Db after tests',
      async ({ dbAuditEvent, dbHealthCheckService, dbPatientService }) => {
        await dbHealthCheckService.deleteItemById(healthCheckId);
        await dbPatientService.deletePatientItemByNhsNumber(testedNhsNumber);
        await dbAuditEvent.deleteItemByNhsNumber(testedNhsNumber);
      }
    );

    test(
      `Partial write-back for multiple schedule reason`,
      {
        tag: ['@integration']
      },
      async ({
        dbAuditEvent,
        dbGpUpdateSchedulerService,
        nhcGpUpdateScheduleProcessorLambdaService
      }) => {
        test.slow();
        const testStartDate = new Date().toISOString();

        await test.step('Check if GpUpdateScheduleProcessor lambda was run successfully', async () => {
          const response =
            await nhcGpUpdateScheduleProcessorLambdaService.triggerLambda();
          expect(response.$metadata.httpStatusCode).toEqual(200);
        });

        await test.step('Check if single event was created after and contains all schedule reason in details', async () => {
          const lastMessage =
            await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
              healthCheckToCreate.nhsNumber as unknown as string,
              AuditEventType.IncompleteDNHCWrittenToGp,
              testStartDate
            );
          expect(lastMessage).toBeTruthy();

          for (const testSchedulerReason of scheduledReasonList) {
            expect(lastMessage?.details?.reasons).toContain(
              testSchedulerReason
            );
          }
          expect(lastMessage?.healthCheckId).toEqual(healthCheckId);
        });

        await test.step('Check if schedule item was removed after successful', async () => {
          let attempts = 0;
          while (attempts < 5) {
            gpUpdateSchedulerItems =
              await dbGpUpdateSchedulerService.getGpUpdateSchedulerItemsByHealthCheckId(
                healthCheckId
              );
            if (gpUpdateSchedulerItems.length === 0) {
              break;
            } else {
              attempts++;
              await dbGpUpdateSchedulerService.pause(1000); // pause before the next attempt
            }
          }

          expect(gpUpdateSchedulerItems.length).toEqual(0);
        });
      }
    );
  });
}
