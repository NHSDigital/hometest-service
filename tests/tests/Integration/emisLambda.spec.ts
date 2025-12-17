import { test, expect } from '../../fixtures/commonFixture';
import { type Config, ConfigFactory } from '../../env/config';
import { v4 as uuidv4 } from 'uuid';
import {
  getHealthCheckQuestionnaireForEmisLambda,
  getHealthCheckQuestionnaireScoresForEmisLambda,
  getHealthCheckRiskScoresForEmisLambda,
  getNhcUpdatePatientRecordLambdaPayload
} from '../../testData/emisPayloadData';
import { type PatientItem } from '../../lib/aws/dynamoDB/DbPatientService';
import {
  getPatientDbItem,
  getRandomNhsNumber
} from '../../testData/patientTestData';
import { type Readable } from 'stream';
import { text } from 'node:stream/consumers';
import { healthyBiometricScores } from '../../testData/biometricTestData';

import { FollowUpEventType } from '../../testData/emisFollowUpTestData';
import { getOdsCodeData, type OdsItem } from '../../testData/odsCodeData';
import {
  AuditEventType,
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
let payloadContents: string;
const listOfS3Objects: string[] = [];
const emisResultsBucket: string = 'emis-request-payload-bucket';

test.describe('Integration tests with EMIS API', () => {
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
        .withQuestionnaire(getHealthCheckQuestionnaireForEmisLambda())
        .withQuestionnaireScores(
          getHealthCheckQuestionnaireScoresForEmisLambda()
        )
        .withRiskScores(getHealthCheckRiskScoresForEmisLambda())
        .withBiometricScores(healthyBiometricScores())
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
    'Integration test for running request to EMIS API',
    {
      tag: ['@emis', '@integration']
    },
    async ({ lambdaService, dbAuditEvent, s3Client, dbOdsCodeService }) => {
      test.slow();
      let fileRecordName = '';
      const testStartDate = new Date().toISOString();
      const response = await lambdaService.runLambdaWithParameters(
        `${config.name}NhcUpdatePatientRecordLambda`,
        getNhcUpdatePatientRecordLambdaPayload(
          healthCheckId,
          testedNhsNumber,
          testPatient.gpOdsCode
        )
      );
      expect(response.$metadata.httpStatusCode).toEqual(200);

      await test.step('Check if event DnhcResultsWrittenToGp was created in DB after successful request to EMIS API', async () => {
        const lastMessage =
          await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
            healthCheckToCreate.nhsNumber as unknown as string,
            AuditEventType.DnhcResultsWrittenToGp,
            testStartDate
          );
        expect(lastMessage).toBeTruthy();
        expect(lastMessage?.details?.followUp).toEqual(
          FollowUpEventType.UrgentFollowUp
        );
        expect(lastMessage?.healthCheckId).toEqual(healthCheckId);
      });

      await test.step('Check if file are in the S3 Bucket, in the GetActiveUsers folder and contains gpOdsCode in the filename', async () => {
        let getActiveUsersFilename = '';
        const s3List = await s3Client.getS3BucketObjectsFilterByDatetime(
          emisResultsBucket,
          testStartDate,
          'GetActiveUsers/'
        );
        console.log(
          `Files created in the ${emisResultsBucket}, in the GetActiveUsers folder, since ${testStartDate} :\n${JSON.stringify(s3List, null, 2)}`
        );
        s3List.forEach((element) => {
          if (element.Key.includes(gpOdsCodeItem.gpOdsCode)) {
            getActiveUsersFilename = element.Key;
            listOfS3Objects.push(getActiveUsersFilename);
          }
        });
        expect(getActiveUsersFilename).toContain(testPatient.gpOdsCode);
      });

      await test.step('Check if file are in the S3 Bucket, in the FileRecord folder and contains healthCheckId in the filename', async () => {
        const s3List = await s3Client.getS3BucketObjectsFilterByDatetime(
          emisResultsBucket,
          testStartDate,
          'FileRecord/'
        );
        console.log(
          `Files created in the ${emisResultsBucket}, in the FileRecord folder, since ${testStartDate} :\n${JSON.stringify(s3List, null, 2)}`
        );
        s3List.forEach((element) => {
          if (element.Key.includes(healthCheckId)) {
            fileRecordName = element.Key;
            listOfS3Objects.push(fileRecordName);
          }
        });

        expect(fileRecordName).toContain(healthCheckId);
      });

      await test.step('Verify payload contents sent to EMIS and saved to the s3 bucket', async () => {
        const payloadFile = await s3Client.getS3ObjectDetails(
          emisResultsBucket,
          fileRecordName
        );

        const payload = payloadFile.Body;
        expect(payload).toBeDefined();
        payloadContents = await text(payload as Readable);
        expect(payloadContents).toContain(
          'Body height (observable entity) 190 cm'
        );
        expect(payloadContents).toContain(
          'Body mass index (observable entity) 21 kg/m2'
        );
        expect(payloadContents).toContain(
          'Diastolic blood pressure (observable entity) 90 mmHg'
        );
        expect(payloadContents).toContain(
          'Systolic blood pressure (observable entity) 160 mmHg'
        );
        expect(payloadContents).toContain(
          '<Code><Value>160303001</Value><Scheme>SNOMED</Scheme><Term>Family history of diabetes mellitus (situation)</Term></Code>'
        );
        expect(payloadContents).toContain(
          'Body weight (observable entity) 100 kg'
        );
        expect(payloadContents).toContain(
          'Leicester Diabetes Risk Score (observable entity) 13'
        );
        expect(payloadContents).toContain(
          'Waist circumference (observable entity) 70 cm'
        );
        expect(payloadContents).toContain(
          `Serum cholesterol level (observable entity) ${healthCheckToCreate.biometricScores?.[0]?.scores?.cholesterol?.totalCholesterol} mmol/L`
        );
        expect(payloadContents).toContain(
          `Serum high density lipoprotein cholesterol level (observable entity) ${healthCheckToCreate.biometricScores?.[0]?.scores?.cholesterol?.hdlCholesterol} mmol/L`
        );
        expect(payloadContents).toContain(
          `High density/low density lipoprotein ratio (observable entity) ${healthCheckToCreate.biometricScores?.[0]?.scores?.cholesterol?.totalCholesterolHdlRatio} mmol/L`
        );
        expect(payloadContents).toContain(
          `Haemoglobin A1c level (observable entity) ${healthCheckToCreate.biometricScores?.[0]?.scores?.diabetes?.hba1c} mmol/L`
        );
        expect(payloadContents).toContain('NHS Health Check online');
      });

      await test.step('Check if additional information from AboutYou section exists in EMIS payload', () => {
        expect(payloadContents).toContain(
          'The patient gave the following answers when asked if they have been'
        );
        expect(payloadContents).toContain(
          `Diagnosed with Lupus - ${healthCheckToCreate.questionnaire?.lupus === true ? 'Yes' : 'No'}`
        );
        expect(payloadContents).toContain(
          `Diagnosed with a severe mental health condition - ${healthCheckToCreate.questionnaire?.severeMentalIllness === true ? 'Yes' : 'No'}`
        );
        expect(payloadContents).toContain(
          `Prescribed atypical antipsychotics - ${healthCheckToCreate.questionnaire?.atypicalAntipsychoticMedication === true ? 'Yes' : 'No'}`
        );
        expect(payloadContents).toContain(
          `Diagnosed with erectile dysfunction - ${healthCheckToCreate.questionnaire?.impotence === true ? 'Yes' : 'No'}`
        );
        expect(payloadContents).toContain(
          `Diagnosed with migraines - ${healthCheckToCreate.questionnaire?.migraines === true ? 'Yes' : 'No'}`
        );
        expect(payloadContents).toContain(
          `Diagnosed with rheumatoid arthritis - ${healthCheckToCreate.questionnaire?.rheumatoidArthritis === true ? 'Yes' : 'No'}`
        );
        expect(payloadContents).toContain(
          `Prescribed regular steroid tablets - ${healthCheckToCreate.questionnaire?.steroidTablets === true ? 'Yes' : 'No'}`
        );
      });

      await test.step('Check id refID and guiID was added into GpOdsCode item', async () => {
        const gpOdsCodeDbItem = await dbOdsCodeService.getGpOdsItemByOdsCOde(
          gpOdsCodeItem.gpOdsCode
        );

        expect(gpOdsCodeDbItem?.refId).toBeDefined();
        expect(gpOdsCodeDbItem?.guid).toBeDefined();
      });
    }
  );
});
