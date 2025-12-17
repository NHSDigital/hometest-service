import { test, expect } from '../../../fixtures/commonFixture';
import { type Config, ConfigFactory } from '../../../env/config';
import { v4 as uuidv4 } from 'uuid';
import { getPatientDbItem } from '../../../testData/patientTestData';
import { type S3ObjectData } from '../../../lib/aws/S3Service';
import { ScheduledReason } from '../../../lib/apiClients/HealthCheckModel';
import type { OdsItem } from '../../../testData/odsCodeData';
import {
  AuditEventType,
  AutoExpiryStatus,
  HealthCheckSteps,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
import { HealthCheckBuilder } from '../../../testData/healthCheck/healthCheckBuilder';
import { getDateWithDaysOffset } from '../../../lib/DateUtils';
import {
  HealthCheckFactory,
  HealthCheckType
} from '../../../testData/healthCheck/healthCheckFactory';
import { eligibleAndDeclarationSectionsOnlyQuestionnaireData } from '../../../testData/questionnairesTestData';

const config: Config = ConfigFactory.getConfig();

let healthChecksToArchive: IHealthCheck[];
let healthChecksNotToArchive: IHealthCheck[];
let ruleNames: string[];
const partialWriteBackS3Files: Record<string, S3ObjectData | undefined> = {};
let testStartDate: string;
const emisResultsBucket: string = 'emis-request-payload-bucket';
const autoExpiryEventType: String = 'QuestionnaireExpiry';

const userUnderTest = {
  nhsNumber: '0000010101',
  patientId: uuidv4(),
  odsCode: 'mock_enabled_code_2'
};

export default function initAutoExpiryLambdaTests(): void {
  test.describe('Health check auto expiry', () => {
    test.skip(
      config.autoExpiryEnabled !== true,
      'Only runs on environments with auto expiry enabled, set autoExpiryEnabled in test config and ENABLE_AUTO_EXPIRY in env config'
    );
    test.beforeAll(
      'Disabling EventBridge lambda triggers',
      async ({ eventBridgeService, dbOdsCodeService }) => {
        ruleNames = [
          await eventBridgeService.getRuleName('nhc-gp-partial'),
          await eventBridgeService.getRuleName('nhc-expired')
        ];
        await Promise.all(
          ruleNames.map(async (ruleName) => {
            await eventBridgeService.disableEventBridgeRule(ruleName);
          })
        );
        await dbOdsCodeService.createGpOdsCodeItem({
          gpOdsCode: userUnderTest.odsCode,
          enabled: true
        } as OdsItem);
      }
    );

    test.afterAll(
      'Enabling EventBridge lambda triggers',
      async ({ eventBridgeService, dbOdsCodeService }) => {
        await Promise.all(
          ruleNames.map(async (ruleName) => {
            await eventBridgeService.enableEventBridgeRule(ruleName);
          })
        );
        await dbOdsCodeService.deleteGpOdsCodeItem(userUnderTest.odsCode);
      }
    );

    test.beforeEach(
      'Creating a health check item in Db',
      async ({ dbHealthCheckService, dbAuditEvent, dbPatientService }) => {
        await dbAuditEvent.deleteItemByNhsNumber(userUnderTest.nhsNumber);
        await dbPatientService.createPatient(
          getPatientDbItem(
            userUnderTest.nhsNumber,
            userUnderTest.patientId,
            userUnderTest.odsCode
          )
        );

        healthChecksToArchive = [
          new HealthCheckBuilder(userUnderTest)
            .withCreatedAt(getDateWithDaysOffset(-31))
            .withQuestionnaire(
              eligibleAndDeclarationSectionsOnlyQuestionnaireData()
            )
            .withStep(HealthCheckSteps.INIT)
            .build(),
          new HealthCheckBuilder(userUnderTest)
            .withCreatedAt(getDateWithDaysOffset(-30))
            .withQuestionnaire(
              eligibleAndDeclarationSectionsOnlyQuestionnaireData()
            )
            .withStep(HealthCheckSteps.INIT)
            .build()
        ];

        healthChecksNotToArchive = [
          new HealthCheckBuilder(userUnderTest)
            .withCreatedAt(getDateWithDaysOffset(-28))
            .withQuestionnaire(
              eligibleAndDeclarationSectionsOnlyQuestionnaireData()
            )
            .withStep(HealthCheckSteps.INIT)
            .build(),
          HealthCheckFactory.createHealthCheck(
            userUnderTest,
            HealthCheckType.QUESTIONNAIRE_COMPLETED
          )
        ];

        // create all health checks, lab orders and lab results that should be archived
        await Promise.all(
          healthChecksToArchive.map(async (hc) => {
            await dbHealthCheckService.createHealthCheck(hc);
          })
        );

        // create health checks, lab orders and lab results that should NOT be archived
        await Promise.all(
          healthChecksNotToArchive.map(async (hc) => {
            await dbHealthCheckService.createHealthCheck(hc);
          })
        );
      }
    );

    test.afterEach(
      'Cleaning up test data',
      async ({
        dbAuditEvent,
        dbPatientService,
        dbHealthCheckService,
        s3Client,
        dbCommunicationLogService
      }) => {
        await dbAuditEvent.deleteItemByNhsNumber(userUnderTest.nhsNumber);
        await dbPatientService.deletePatientItemByNhsNumber(
          userUnderTest.nhsNumber
        );

        await Promise.all(
          healthChecksToArchive.map(async (hc) => {
            await dbHealthCheckService.deleteItemById(hc.id);
            await dbCommunicationLogService.deleteAllCommunicationLogByHealthCheckId(
              hc.id
            );
          })
        );
        await Promise.all(
          healthChecksNotToArchive.map(async (hc) => {
            await dbHealthCheckService.deleteItemById(hc.id);
          })
        );
        await s3Client.deleteObjectsFilteredByDate(
          emisResultsBucket,
          testStartDate,
          'IncompleteFileRecord/'
        );
      }
    );

    test(
      'Auto expire old health checks in INIT state with their lab order data',
      {
        tag: ['@autoExpiry', '@integration']
      },
      async ({
        lambdaService,
        nhcGpUpdateScheduleProcessorLambdaService,
        dbHealthCheckService,
        dbGpUpdateSchedulerService,
        s3Client,
        dbAuditEvent,
        dbCommunicationLogService
      }) => {
        test.slow();
        testStartDate = new Date(Date.now() - 2000).toISOString();

        await test.step('Run NhcDataExpiryLambda for executing the expiry service', async () => {
          const response = await lambdaService.runLambdaWithParameters(
            `${config.name}NhcDataExpiryLambda`,
            {}
          );
          expect(response.$metadata.httpStatusCode).toEqual(200);
        });

        await test.step('Check if the QuestionnaireExpiry communication log item was created in DB', async () => {
          await Promise.all(
            healthChecksToArchive.map(async (healthCheck) => {
              const communicationLogItem =
                await dbCommunicationLogService.waitForCommunicationItemsByHealthCheckId(
                  healthCheck.id
                );

              expect(
                communicationLogItem?.type,
                'Communication log item type is different than expected'
              ).toEqual(autoExpiryEventType);
            })
          );
        });

        await test.step('Check relevant health check DB data was changed to expired for each health check expired', async () => {
          await Promise.all(
            healthChecksToArchive.map(async (healthCheck) => {
              const updatedHealthCheck =
                await dbHealthCheckService.getHealthCheckItemById(
                  healthCheck.id
                );

              expect(updatedHealthCheck.step).toEqual('AUTO_EXPIRED');
              expect(updatedHealthCheck.expiryStatus).toEqual(
                'GP_PARTIAL_UPDATE_SCHEDULED'
              );
              expect(updatedHealthCheck.patientId).toEqual(
                userUnderTest.patientId
              );
              expect(
                updatedHealthCheck.expiredAt !== undefined &&
                  updatedHealthCheck.expiredAt > testStartDate
              ).toBeTruthy();
            })
          );
        });

        await test.step('Check if schedule item were created after running auto expiry lambda', async () => {
          await Promise.all(
            healthChecksToArchive.map(async (hc) => {
              const scheduleItem =
                await dbGpUpdateSchedulerService.waitForGpSchedulerItemsByHealthCheckId(
                  hc.id,
                  ScheduledReason.ExpiryQuestionnaire,
                  testStartDate
                );
              expect(scheduleItem).toBeTruthy();
            })
          );

          await Promise.all(
            healthChecksNotToArchive.map(async (hc) => {
              const scheduleList =
                await dbGpUpdateSchedulerService.getGpUpdateSchedulerItemsByHealthCheckId(
                  hc.id
                );
              expect(scheduleList.length).toEqual(0);
            })
          );
        });

        await test.step('Trigger GP partial write back to handle expiry schedule', async () => {
          const response =
            await nhcGpUpdateScheduleProcessorLambdaService.triggerLambda();
          expect(response.$metadata.httpStatusCode).toEqual(200);
        });

        await test.step('Check if file are in the S3 Bucket, in the IncompleteFileRecord folder and contains healthCheckId in the filename', async () => {
          await Promise.all(
            healthChecksToArchive.map(async (healthCheck) => {
              partialWriteBackS3Files[healthCheck.id] =
                await s3Client.waitForFileByPartialKeyName(
                  emisResultsBucket,
                  'IncompleteFileRecord/',
                  healthCheck.id,
                  testStartDate
                );

              expect(partialWriteBackS3Files[healthCheck.id]?.Key).toContain(
                healthCheck.id
              );
            })
          );
        });

        await test.step('Check relevant health check DB data has updated status - GP_PARTIAL_UPDATE_SUCCESS', async () => {
          await Promise.all(
            healthChecksToArchive.map(async (healthCheck) => {
              const updatedHealthCheck =
                await dbHealthCheckService.waitForExpiryStatusUpdate(
                  healthCheck.id,
                  AutoExpiryStatus.GP_PARTIAL_UPDATE_SUCCESS
                );
              expect(updatedHealthCheck?.step).toEqual('AUTO_EXPIRED');
            })
          );
        });

        await test.step('Trigger Auto expiry lambda again, to clear down expired data', async () => {
          const response = await lambdaService.runLambdaWithParameters(
            `${config.name}NhcDataExpiryLambda`,
            {}
          );

          expect(response.$metadata.httpStatusCode).toEqual(200);
        });

        await test.step('Check relevant health check DB data was changed to expired for each health check expired', async () => {
          await Promise.all(
            healthChecksToArchive.map(async (healthCheck) => {
              const updatedHealthCheck =
                await dbHealthCheckService.getHealthCheckItemById(
                  healthCheck.id
                );
              expect(updatedHealthCheck.step).toEqual('AUTO_EXPIRED');
              expect(updatedHealthCheck.expiryStatus).toEqual('COMPLETE');
              expect(updatedHealthCheck.questionnaire).toEqual({});
              expect(updatedHealthCheck.questionnaireScores).toEqual(undefined);
              expect(updatedHealthCheck.questionnaireCompletionDate).toEqual(
                undefined
              );
              expect(updatedHealthCheck.riskScores).toEqual(undefined);
            })
          );
        });

        await test.step('Check new health check DB data was NOT changed to expired for each health check', async () => {
          await Promise.all(
            healthChecksNotToArchive.map(async (healthCheck) => {
              const updatedHealthCheck =
                await dbHealthCheckService.getHealthCheckItemById(
                  healthCheck.id
                );
              expect(updatedHealthCheck.step).not.toEqual('AUTO_EXPIRED');
              expect(updatedHealthCheck.expiryStatus).toBeUndefined();
              expect(updatedHealthCheck).toEqual(healthCheck);
              expect(updatedHealthCheck.patientId).toEqual(
                userUnderTest.patientId
              );
            })
          );
        });

        await test.step('Check HealthCheckExpired audit events created for each health check expired', async () => {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          const expiryAuditEvents = (
            await dbAuditEvent.getAllAuditEventItemsByNhsNumberAndFilterByDatetime(
              userUnderTest.nhsNumber,
              testStartDate
            )
          ).filter((auditItem) => auditItem.eventType === 'HealthCheckExpired');
          expect(expiryAuditEvents.length).toEqual(2);
          expect(expiryAuditEvents.map((event) => event.healthCheckId)).toEqual(
            expect.arrayContaining(healthChecksToArchive.map((hc) => hc.id))
          );
        });

        await test.step('Check if the audit event was created with the message type HealthCheckExpiredPatientNotification', async () => {
          const auditEventItem =
            await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
              userUnderTest.nhsNumber,
              AuditEventType.HealthCheckExpiredPatientNotification,
              testStartDate
            );

          expect(
            auditEventItem?.details?.messageType,
            'Audit Event message type is different than expected'
          ).toEqual(autoExpiryEventType);
          expect(
            auditEventItem?.details?.notifyMessageID,
            'NotifyMessageID was not found in Audit Event details'
          ).toBeDefined();
          expect(
            auditEventItem?.details?.journeySectionsComplete,
            'journeySectionsComplete does not contain eligibility section'
          ).toContain('eligibility');
        });

        await test.step('Check if schedule item were removed after processing', async () => {
          for (const healthCheckList of [
            healthChecksToArchive,
            healthChecksNotToArchive
          ]) {
            await Promise.all(
              healthCheckList.map(async (hc) => {
                const scheduleList =
                  await dbGpUpdateSchedulerService.getGpUpdateSchedulerItemsByHealthCheckId(
                    hc.id
                  );
                expect(scheduleList.length).toEqual(0);
              })
            );
          }
        });
      }
    );
  });
}
