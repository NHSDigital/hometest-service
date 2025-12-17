import { test, expect } from '../../../fixtures/commonFixture';
import { type Config, ConfigFactory } from '../../../env/config';
import { v4 as uuidv4 } from 'uuid';
import { type PatientItem } from '../../../lib/aws/dynamoDB/DbPatientService';
import {
  getPatientDbItem,
  getRandomNhsNumber
} from '../../../testData/patientTestData';
import {
  AuditEventType,
  HealthCheckSteps,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
import { generateStringDateWithChangedDays } from '../../../testData/bloodTestExpiryWritebackTestData';
import { questionnairesData } from '../../../testData/questionnairesTestData';
import { getOdsCodeData, type OdsItem } from '../../../testData/odsCodeData';
import { HealthCheckBuilder } from '../../../testData/healthCheck/healthCheckBuilder';

let testStartDate: string;
let healthCheckId: string;
let healthCheckToCreate: IHealthCheck;
let testedNhsNumber: string;
let testPatient: PatientItem;
let ruleNames: string[];
const emisResultsBucket: string = 'emis-request-payload-bucket';
const config: Config = ConfigFactory.getConfig();
let odsCodeItem: OdsItem;

export default function questionnaireExpiresWithoutBloodOrderTest(): void {
  test.describe('Expire health check test', () => {
    test.skip(
      config.autoExpiryEnabled !== true || config.emisMock === false,
      'Only runs on environments with auto expiry enabled, set autoExpiryEnabled in test config and ENABLE_AUTO_EXPIRY in env config and with EMIS mock'
    );
    test.beforeEach(
      'Creating a health check item and schedule in Db',
      async ({
        eventBridgeService,
        dbHealthCheckService,
        dbPatientService,
        dbOdsCodeService
      }) => {
        ruleNames = [
          await eventBridgeService.getRuleName('nhc-gp-partial'),
          await eventBridgeService.getRuleName('nhc-expired')
        ];
        await Promise.all(
          ruleNames.map(async (ruleName) => {
            await eventBridgeService.disableEventBridgeRule(ruleName);
          })
        );

        testedNhsNumber = getRandomNhsNumber();
        odsCodeItem = getOdsCodeData();
        testPatient = getPatientDbItem(
          testedNhsNumber,
          uuidv4(),
          odsCodeItem.gpOdsCode
        );
        healthCheckToCreate = new HealthCheckBuilder(testPatient)
          .withExpiredAt(new Date().toISOString())
          .withCreatedAt(generateStringDateWithChangedDays(-92))
          .withQuestionnaireCompletionDate(
            generateStringDateWithChangedDays(-92)
          )
          .withStep(HealthCheckSteps.QUESTIONNAIRE_COMPLETED)
          .withQuestionnaire(questionnairesData())
          .build();

        healthCheckId = healthCheckToCreate.id;
        await dbHealthCheckService.createHealthCheck(healthCheckToCreate);
        await dbPatientService.createPatient(testPatient);
        await dbOdsCodeService.createGpOdsCodeItem(odsCodeItem);
      }
    );

    test.afterEach(
      'Deleting a health check and patient item from Db after tests',
      async ({
        eventBridgeService,
        dbHealthCheckService,
        dbPatientService,
        dbGpUpdateSchedulerService,
        dbOdsCodeService,
        s3Client
      }) => {
        await Promise.all(
          ruleNames.map(async (ruleName) => {
            await eventBridgeService.enableEventBridgeRule(ruleName);
          })
        );
        await dbHealthCheckService.deleteItemById(healthCheckId);
        await dbGpUpdateSchedulerService.deleteGpUpdateSchedulerItemByHealthCheckId(
          healthCheckId
        );
        await dbPatientService.deletePatientItemByNhsNumber(testedNhsNumber);
        await dbOdsCodeService.deleteGpOdsCodeItem(odsCodeItem.gpOdsCode);

        await s3Client.deleteObjectsFilteredByDate(
          emisResultsBucket,
          testStartDate,
          'IncompleteFileRecord/'
        );
      }
    );

    test(
      `Health check expires after 90 days without ordering lab tests`,
      {
        tag: ['@integration', '@emis', '@autoExpiry', '@partial-write-back']
      },
      async ({
        expiryLambdaService,
        nhcGpUpdateScheduleProcessorLambdaService,
        dbGpUpdateSchedulerService,
        dbHealthCheckService,
        dbAuditEvent
      }) => {
        test.slow();
        testStartDate = new Date().toISOString();

        await test.step('Run expiry lambda', async () => {
          const response = await expiryLambdaService.triggerLambda();
          expect(
            response.$metadata.httpStatusCode,
            'Expiry lambda trigger failed'
          ).toEqual(200);
        });

        await test.step('Verify that health check status got updated to AUTO_EXPIRED_BLOOD_NOT_ORDERED', async () => {
          test.setTimeout(200000);
          const healthCheckItem =
            await dbHealthCheckService.getHealthCheckItemById(healthCheckId);

          expect(
            healthCheckItem.expiryStatus,
            'Health check expiry status has not been updated by expiry lambda'
          ).toEqual('GP_PARTIAL_UPDATE_SCHEDULED');
          expect(
            healthCheckItem.step,
            'Health check step has not been updated by expiry lambda'
          ).toEqual('AUTO_EXPIRED_BLOOD_NOT_ORDERED');
        });

        await test.step('Check if GpScheduler with scheduledReason expiryNoBloodResultFinal was created', async () => {
          const gpUpdateSchedulerItems =
            await dbGpUpdateSchedulerService.getGpUpdateSchedulerItemsByHealthCheckId(
              healthCheckId
            );
          expect(gpUpdateSchedulerItems[0].scheduleReason).toEqual(
            'expiryNoBloodResultInitial'
          );
        });

        await test.step('Run partial scheduler processor lambda', async () => {
          const response =
            await nhcGpUpdateScheduleProcessorLambdaService.triggerLambda();
          expect(response.$metadata.httpStatusCode).toEqual(200);
        });

        await test.step('Check if IncompleteDNHCWrittenToGp audit event with expiryNoBloodResultFinal reason was created', async () => {
          const IncompleteDNHCWrittenToGpMessage =
            await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
              healthCheckToCreate.nhsNumber as unknown as string,
              AuditEventType.IncompleteDNHCWrittenToGp,
              testStartDate
            );
          expect(IncompleteDNHCWrittenToGpMessage?.details?.reasons).toContain(
            'expiryNoBloodResultInitial'
          );
        });

        await test.step('Run expiry lambda', async () => {
          const response = await expiryLambdaService.triggerLambda();
          expect(response.$metadata.httpStatusCode).toEqual(200);
        });

        await test.step('Check if healthCheck expiryStatus was updated to AUTO_EXPIRED_BLOOD_NOT_ORDERED and step to COMPLETE after running NhcDataExpiryLambda lambda', async () => {
          const healthCheckItem =
            await dbHealthCheckService.getHealthCheckItemById(healthCheckId);

          expect(healthCheckItem.expiryStatus).toEqual('COMPLETE');
          expect(healthCheckItem.step).toEqual(
            'AUTO_EXPIRED_BLOOD_NOT_ORDERED'
          );
          expect(healthCheckItem.questionnaire).toEqual({});
        });
      }
    );
  });
}
