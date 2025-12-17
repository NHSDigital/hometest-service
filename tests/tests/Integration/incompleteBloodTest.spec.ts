import { test, expect } from '../../fixtures/commonFixture';
import { type Config, ConfigFactory } from '../../env/config';
import { getNhcUpdatePatientRecordLambdaPayload } from '../../testData/emisPayloadData';
import { type PatientItem } from '../../lib/aws/dynamoDB/DbPatientService';
import { getPatientDbItem } from '../../testData/patientTestData';
import { type Readable } from 'stream';
import { text } from 'node:stream/consumers';
import {
  getIncompleteBloodTestCholesterolDiabetesReorderFailed,
  getIncompleteBloodTestCholesterolDiabetesReorderSuccess,
  getIncompleteBloodTestCholesterolReorderSuccessDiabetesReorderFailed
} from '../../testData/incompleteBloodTestData';
import {
  healthyHealthCheckQuestionnaire,
  healthyHealthCheckQuestionnaireScores,
  healthyHealthCheckRiskScores
} from '../../testData/questionnairesTestData';
import {
  AuditEventType,
  HealthCheckSteps,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
import { type OdsItem } from '../../testData/odsCodeData';
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
  getIncompleteBloodTestCholesterolDiabetesReorderFailed(),
  getIncompleteBloodTestCholesterolDiabetesReorderSuccess(),
  getIncompleteBloodTestCholesterolReorderSuccessDiabetesReorderFailed()
].forEach(
  ({
    biometricScoreData,
    expectedMessages,
    isHealthCheckCompleted,
    description
  }) => {
    test.describe(`Emis integration with incomplete blood tests`, () => {
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
          testedNhsNumber = '0000000166';
          testPatient = getPatientDbItem(testedNhsNumber);

          healthCheckToCreate = new HealthCheckBuilder(testedUser)
            .withStep(HealthCheckSteps.LAB_RESULTS_RECEIVED)
            .withQuestionnaire(healthyHealthCheckQuestionnaire())
            .withQuestionnaireScores(healthyHealthCheckQuestionnaireScores())
            .withRiskScores(healthyHealthCheckRiskScores())
            .withBiometricScores(biometricScoreData)
            .build();

          healthCheckId = healthCheckToCreate.id;

          gpOdsCodeItem = {
            gpOdsCode: 'mock_enabled_code',
            enabled: true,
            gpEmail: 'email_verification+mock_enabled_code@mockdhctest.org',
            localAuthority: `Automated Test mock_enabled_code Authority`,
            gpName: 'Mock mock_enabled_code General Practice'
          };

          await dbAuditEvent.deleteItemByNhsNumber(testedNhsNumber);
          await dbHealthCheckService.createHealthCheck(healthCheckToCreate);
          await dbPatientService.createPatient(testPatient);
          await dbOdsCodeService.createGpOdsCodeItem(gpOdsCodeItem);
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
          await dbOdsCodeService.createGpOdsCodeItem(gpOdsCodeItem);
          for (const s3Object of listOfS3Objects) {
            await s3Client.deleteObjectInS3Bucket(emisResultsBucket, s3Object);
          }
        }
      );

      test(
        `Integration test - request to EMIS API with incomplete blood test - ${description}`,
        {
          tag: ['@emis', '@integration']
        },
        async ({ lambdaService, s3Client, dbAuditEvent }) => {
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
          });

          await test.step('Verify payload contents sent to EMIS and saved to the s3 bucket due to incomplete blood test failures', async () => {
            const payloadFile = await s3Client.getS3ObjectDetails(
              emisResultsBucket,
              fileRecordName
            );

            const payload = payloadFile.Body;
            expect(payload).toBeDefined();
            const payloadContents = await text(payload as Readable);

            expectedMessages.forEach((message) => {
              expect(payloadContents).toContain(message);
            });

            if (isHealthCheckCompleted === true) {
              expect(payloadContents).toContain(
                'Digital National Health Service Health Check completed (situation)'
              );
            } else {
              expect(payloadContents).toContain(
                'Digital National Health Service Health Check stopped (situation)'
              );
            }
          });

          await test.step('Check if correct event was created after sending request to GP', async () => {
            if (isHealthCheckCompleted === true) {
              let expectedHbA1cResult: string = 'failure';
              const lastMessage =
                await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
                  healthCheckToCreate.nhsNumber as unknown as string,
                  AuditEventType.DnhcResultsWrittenToGp,
                  testStartDate
                );

              biometricScoreData.forEach((biometricScore) => {
                if (
                  biometricScore.scores?.diabetes &&
                  'hba1c' in biometricScore.scores?.diabetes
                ) {
                  expectedHbA1cResult = 'successful';
                }
              });

              expect(lastMessage?.details?.HbA1cStatus).toEqual(
                expectedHbA1cResult
              );
            } else {
              const lastMessage =
                await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
                  healthCheckToCreate.nhsNumber as unknown as string,
                  AuditEventType.IncompleteDNHCWrittenToGp,
                  testStartDate
                );
              expect(lastMessage?.details?.reasons).toEqual([
                'cholesterolTestFailed'
              ]);
            }
          });
        }
      );
    });
  }
);
