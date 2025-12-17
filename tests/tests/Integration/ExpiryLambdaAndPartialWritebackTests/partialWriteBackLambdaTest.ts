import { test, expect } from '../../../fixtures/commonFixture';
import { v4 as uuidv4 } from 'uuid';
import { type PatientItem } from '../../../lib/aws/dynamoDB/DbPatientService';
import {
  getPatientDbItem,
  getRandomNhsNumber,
  patientOdsCodeForThrivaIntegration
} from '../../../testData/patientTestData';
import { type S3ObjectData } from '../../../lib/aws/S3Service';
import { type Readable } from 'stream';
import { text } from 'node:stream/consumers';
import { ScheduledReason } from '../../../lib/apiClients/HealthCheckModel';
import { type GpUpdateSchedulerItem } from '../../../lib/aws/dynamoDB/DbGpUpdateSchedulerService';
import {
  healthyHealthCheckQuestionnaire,
  healthyHealthCheckQuestionnaireScores
} from '../../../testData/questionnairesTestData';
import { GpEmailTestHelper } from '../../../lib/email/GpEmailTestHelper';
import { Smoking, type IHealthCheck } from '@dnhc-health-checks/shared';
import { HealthCheckBuilder } from '../../../testData/healthCheck/healthCheckBuilder';

let testStartDate: string;
let healthCheckId: string;
let healthCheckToCreate: IHealthCheck;
let testedNhsNumber: string;
let testPatient: PatientItem;
let gpUpdateSchedulerId: string;
let gpUpdateSchedulerToCreate: GpUpdateSchedulerItem;
let partialWriteBackS3File: S3ObjectData | undefined;
let ruleName: string;
let payloadContents: string;
let odsCode: string;
let gpEmailHelper: GpEmailTestHelper;
const emisResultsBucket: string = 'emis-request-payload-bucket';

const partialWriteBackSnomedCode = '2242641000000108';

export default function partialWriteBackLambdaTest(): void {
  test.describe('Integration tests with partial write-back and EMIS API', () => {
    testStartDate = new Date().toISOString();

    test.beforeAll(
      'Disabling EventBridge lambda trigger and cleaning up scheduler db',
      async ({ eventBridgeService }) => {
        ruleName = await eventBridgeService.getRuleName('nhc-gp-partial');
        await eventBridgeService.disableEventBridgeRule(ruleName);
      }
    );

    test.beforeEach(
      'Creating a health check item and schedule in Db',
      async ({
        config,
        testedUser,
        dbAuditEvent,
        dbHealthCheckService,
        dbPatientService,
        dbGpUpdateSchedulerService
      }) => {
        if (config.integratedEnvironment) {
          testedNhsNumber = testedUser.nhsNumber;
          testPatient =
            await dbPatientService.getPatientItemByNhsNumber(testedNhsNumber);
          odsCode = patientOdsCodeForThrivaIntegration;
          await dbPatientService.updatePatientOdsCode(testedNhsNumber, odsCode);
          gpEmailHelper = new GpEmailTestHelper(testedNhsNumber, odsCode);
        } else {
          testedNhsNumber = getRandomNhsNumber();
          gpEmailHelper = new GpEmailTestHelper(testedNhsNumber);
          odsCode = gpEmailHelper.getOdsCode();
          testPatient = getPatientDbItem(testedNhsNumber, uuidv4(), odsCode);
          await dbPatientService.createPatient(testPatient);
        }
        await dbHealthCheckService.deleteItemByNhsNumber(testedNhsNumber);
        await gpEmailHelper.setupGpEmailTest();
        gpUpdateSchedulerId = uuidv4();
        healthCheckToCreate = new HealthCheckBuilder(testedUser)
          .withNhsNumber(testedNhsNumber)
          .withPatientId(testPatient.patientId ?? '')
          .withQuestionnaire(
            healthyHealthCheckQuestionnaire({
              bloodPressureDiastolic: 100,
              smoking: Smoking.TenToNineteenPerDay
            })
          )
          .withQuestionnaireScores(
            healthyHealthCheckQuestionnaireScores({
              auditScore: 20
            })
          )
          .build();

        healthCheckId = healthCheckToCreate.id;

        gpUpdateSchedulerToCreate = {
          scheduleId: gpUpdateSchedulerId,
          createdAt: healthCheckToCreate.createdAt,
          healthCheckId,
          scheduleReason: ScheduledReason.UrgentHighBP,
          status: 'New'
        };

        await dbAuditEvent.deleteItemByNhsNumber(testedNhsNumber);
        await dbHealthCheckService.createHealthCheck(healthCheckToCreate);
        await dbGpUpdateSchedulerService.createGpSchedulerItem(
          gpUpdateSchedulerToCreate
        );
      }
    );

    test.afterEach(
      'Deleting a health check and patient item from Db after tests',
      async ({
        config,
        dbAuditEvent,
        dbHealthCheckService,
        dbGpUpdateSchedulerService,
        dbPatientService,
        s3Client
      }) => {
        await gpEmailHelper.cleanupGpEmailTest(false);
        await dbHealthCheckService.deleteItemById(healthCheckId);
        await dbGpUpdateSchedulerService.deleteGpUpdateSchedulerItemByHealthCheckId(
          healthCheckId
        );
        await dbAuditEvent.deleteItemByNhsNumber(testedNhsNumber);

        if (config.emisMock === false) {
          await dbPatientService.updatePatientOdsCode(
            testedNhsNumber,
            testPatient.gpOdsCode as string
          );
        } else {
          await dbPatientService.deletePatientItemByNhsNumber(testedNhsNumber);
        }

        await s3Client.deleteObjectsFilteredByDate(
          emisResultsBucket,
          testStartDate,
          'IncompleteFileRecord/'
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
      'Integration test for running partial write-back request to EMIS API',
      {
        tag: ['@emis', '@integration', '@partial-write-back']
      },
      async ({
        s3Client,
        dbOdsCodeService,
        nhcGpUpdateScheduleProcessorLambdaService
      }) => {
        test.slow();
        const response =
          await nhcGpUpdateScheduleProcessorLambdaService.triggerLambda();
        expect(response.$metadata.httpStatusCode).toEqual(200);

        await test.step('Check if file are in the S3 Bucket, in the IncompleteFileRecord folder and contains healthCheckId in the filename', async () => {
          partialWriteBackS3File = await s3Client.waitForFileByPartialKeyName(
            emisResultsBucket,
            'IncompleteFileRecord/',
            healthCheckId,
            testStartDate
          );

          expect(partialWriteBackS3File?.Key).toContain(healthCheckId);
        });

        await test.step('Verify payload contents sent to EMIS and saved to the s3 bucket', async () => {
          const payloadFile = await s3Client.getS3ObjectDetails(
            emisResultsBucket,
            partialWriteBackS3File?.Key as unknown as string
          );

          const payload = payloadFile.Body;
          expect(payload).toBeDefined();
          payloadContents = await text(payload as Readable);
          expect(payloadContents).toContain(
            `Body height (observable entity) ${healthCheckToCreate.questionnaire?.height} cm`
          );
          expect(payloadContents).toContain(
            `Body weight (observable entity) ${healthCheckToCreate.questionnaire?.weight} kg`
          );
          expect(payloadContents).toContain(
            `Body mass index (observable entity) ${healthCheckToCreate.questionnaireScores?.bmiScore} kg/m2`
          );
          expect(payloadContents).toContain(
            `Self reported diastolic blood pressure (observable entity) ${healthCheckToCreate.questionnaire?.bloodPressureDiastolic} mmHg`
          );
          expect(payloadContents).toContain(
            `Self reported systolic blood pressure (observable entity) ${healthCheckToCreate.questionnaire?.bloodPressureSystolic} mmHg`
          );
          expect(payloadContents).toContain(
            'Digital National Health Service Health Check stopped (situation)'
          );
          expect(payloadContents).toContain(partialWriteBackSnomedCode);
        });

        await test.step('Check if additional information from AboutYou section NOT exists in partial EMIS payload', () => {
          expect(payloadContents).not.toContain(
            'The patient gave the following answers when asked if they have been'
          );
          expect(payloadContents).not.toContain('Diagnosed with Lupus');
          expect(payloadContents).not.toContain(
            'Diagnosed with a severe mental health condition'
          );
          expect(payloadContents).not.toContain(
            'Prescribed atypical antipsychotics'
          );
          expect(payloadContents).not.toContain(
            'Diagnosed with erectile dysfunction'
          );
          expect(payloadContents).not.toContain('Diagnosed with migraines');
          expect(payloadContents).not.toContain(
            'Diagnosed with rheumatoid arthritis'
          );
          expect(payloadContents).not.toContain(
            'Prescribed regular steroid tablets'
          );
        });

        await test.step('Check if detailed information about follow up exists in the EMIS payload', () => {
          expect(payloadContents).toContain(
            'Self reported diastolic blood pressure (observable entity) - Urgent Follow-up'
          );
          expect(payloadContents).toContain(
            'Alcohol Use Disorders Identification Test - Consumption score (observable entity) - Urgent Follow-up'
          );
          expect(payloadContents).toContain(
            'Moderate cigarette smoker (10-19 cigs/day) (finding) - Routine Follow-up'
          );
        });

        await test.step('Check that email has been sent to GP', async () => {
          await gpEmailHelper.verifyEmailHasBeenSent();
        });

        await test.step('Check if refID and guiID was added into GpOdsCode item', async () => {
          const gpOdsCodeDbItem =
            await dbOdsCodeService.getGpOdsItemByOdsCOde(odsCode);

          expect(gpOdsCodeDbItem?.refId).toBeDefined();
          expect(gpOdsCodeDbItem?.guid).toBeDefined();
        });
      }
    );
  });
}
