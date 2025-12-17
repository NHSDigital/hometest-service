import { test, expect } from '../../fixtures/commonFixture';
import { type Config, ConfigFactory } from '../../env/config';
import { v4 as uuidv4 } from 'uuid';
import { getNhcUpdatePatientRecordLambdaPayload } from '../../testData/emisPayloadData';
import { type PatientItem } from '../../lib/aws/dynamoDB/DbPatientService';
import {
  getPatientDbItem,
  getRandomNhsNumber
} from '../../testData/patientTestData';
import { type Readable } from 'stream';
import { text } from 'node:stream/consumers';
import {
  getEmisPayloadBiometricFollowUpUrgentFollowUp,
  getEmisPayloadBiometricNoFollowUpUrgentFollowUp,
  getEmisPayloadFemaleBiometricFollowUpNoUrgentFollowUp,
  getEmisPayloadFollowUpNoUrgentFollowUp,
  getEmisPayloadFollowUpUrgentFollowUp,
  getEmisPayloadMaleBiometricFollowUpNoUrgentFollowUp,
  getEmisPayloadNoFollowUpNoUrgentFollowUp,
  getEmisPayloadNoFollowUpUrgentFollowUp
} from '../../testData/emisFollowUpTestData';
import { getOdsCodeData, type OdsItem } from '../../testData/odsCodeData';
import {
  HealthCheckSteps,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
import { HealthCheckBuilder } from '../../testData/healthCheck/healthCheckBuilder';

const config: Config = ConfigFactory.getConfig();

let healthCheckId: string;
let healthCheckToCreate: IHealthCheck;
let testedNhsNumber: string;
let gpOdsCodeItem: OdsItem;
let testPatient: PatientItem;
const listOfS3Objects: string[] = [];
const emisResultsBucket: string = 'emis-request-payload-bucket';

[
  getEmisPayloadNoFollowUpNoUrgentFollowUp(),
  getEmisPayloadFollowUpNoUrgentFollowUp(),
  getEmisPayloadFollowUpUrgentFollowUp(),
  getEmisPayloadNoFollowUpUrgentFollowUp(),
  getEmisPayloadFemaleBiometricFollowUpNoUrgentFollowUp(),
  getEmisPayloadMaleBiometricFollowUpNoUrgentFollowUp(),
  getEmisPayloadBiometricFollowUpUrgentFollowUp(),
  getEmisPayloadBiometricNoFollowUpUrgentFollowUp()
].forEach(
  ({
    testQuestionnaire,
    testQuestionnaireScores,
    testRiskScores,
    testBiometricScores,
    expectedFollowUp
  }) => {
    test.describe(`Emis follow-up tests`, () => {
      test.skip(
        config.emisMock === false,
        'Only runs on environments with Emis Mock Api deployed'
      );
      test.beforeEach(
        'Creating a health check item in Db',
        async ({
          dbAuditEvent,
          dbHealthCheckService,
          dbPatientService,
          dbOdsCodeService,
          testedUser
        }) => {
          testedNhsNumber = getRandomNhsNumber();
          gpOdsCodeItem = getOdsCodeData();
          testPatient = getPatientDbItem(
            testedNhsNumber,
            uuidv4(),
            gpOdsCodeItem.gpOdsCode
          );

          healthCheckToCreate = new HealthCheckBuilder(testedUser)
            .withStep(HealthCheckSteps.LAB_RESULTS_RECEIVED)
            .withQuestionnaire(testQuestionnaire)
            .withQuestionnaireScores(testQuestionnaireScores)
            .withRiskScores(testRiskScores)
            .withBiometricScores(testBiometricScores)
            .withAgeAtStart(60)
            .build();

          healthCheckId = healthCheckToCreate.id;
          await dbAuditEvent.deleteItemByNhsNumber(testedNhsNumber);
          await dbHealthCheckService.createHealthCheck(healthCheckToCreate);
          await dbOdsCodeService.createGpOdsCodeItem(gpOdsCodeItem);
          await dbPatientService.createPatient(testPatient);
        }
      );

      test.afterEach(
        'Deleting a health check and patient item from Db after tests',
        async ({
          dbHealthCheckService,
          dbPatientService,
          dbOdsCodeService,
          s3Client
        }) => {
          await dbHealthCheckService.deleteItemById(healthCheckId);
          await dbPatientService.deletePatientItemByNhsNumber(testedNhsNumber);
          await dbOdsCodeService.deleteGpOdsCodeItem(gpOdsCodeItem.gpOdsCode);
          for (const s3Object of listOfS3Objects) {
            await s3Client.deleteObjectInS3Bucket(emisResultsBucket, s3Object);
          }
        }
      );

      test(
        `Integration test for running request to EMIS API with expected follow-up test case - ${expectedFollowUp.desc}`,
        {
          tag: ['@emis', '@integration']
        },
        async ({ lambdaService, s3Client }) => {
          test.slow();
          let fileRecordName = '';
          const testStartDate = new Date().toISOString();
          const response = await lambdaService.runLambdaWithParameters(
            `${config.name}NhcUpdatePatientRecordLambda`,
            getNhcUpdatePatientRecordLambdaPayload(
              healthCheckId,
              testedNhsNumber
            )
          );
          expect(response.$metadata.httpStatusCode).toEqual(200);

          await test.step('Check if file are in the S3 Bucket, in the FileRecord folder and contains healthCheckId in the filename', async () => {
            const searchedS3File = await s3Client.waitForFileByPartialKeyName(
              emisResultsBucket,
              'FileRecord/',
              healthCheckId,
              testStartDate
            );

            fileRecordName = searchedS3File?.Key as unknown as string;

            expect(fileRecordName).toContain(healthCheckId);
            listOfS3Objects.push(fileRecordName);
          });

          await test.step('Verify payload contents sent to EMIS and saved to the s3 bucket due to follow-up entries', async () => {
            const payloadFile = await s3Client.getS3ObjectDetails(
              emisResultsBucket,
              fileRecordName
            );

            const payload = payloadFile.Body;
            expect(payload).toBeDefined();
            const payloadContents = await text(payload as Readable);

            expectedFollowUp.expectedMessagesInPayload.forEach((message) => {
              expect(payloadContents).toContain(message);
            });

            expectedFollowUp.notExpectedMessagesInPayload.forEach((message) => {
              expect(payloadContents).not.toContain(message);
            });
          });
        }
      );
    });
  }
);
