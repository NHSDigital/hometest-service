import { test, expect } from '../../fixtures/commonFixture';
import { type Config, ConfigFactory } from '../../env/config';
import { type AuditEventItem } from '../../lib/aws/dynamoDB/DbAuditEventService';
import NhsLoginHelper from '../../page-objects/NhsLoginHelper';
import { type PatientItem } from '../../lib/aws/dynamoDB/DbPatientService';
import type { IHealthCheck } from '@dnhc-health-checks/shared';
import type {
  NHSLoginMockedUser,
  NHSLoginUser
} from '../../lib/users/BaseUser';

let healthCheck: IHealthCheck | undefined;
let patient: PatientItem;
let listOfEvents: AuditEventItem[];
let healthCheckS3Key: string;
const nhsLoginHelper = new NhsLoginHelper();

const config: Config = ConfigFactory.getConfig();
const reportingBucket = 'reporting-data';

test.describe('Test for Live streaming data to the S3 bucket', () => {
  test.skip(
    config.reportingEnabled !== true,
    'Only runs on environments with reporting enabled, set reportingEnabled in test config and ENABLE_REPORTING_DATA_COPY and ENABLE_REPORTING_EXTERNAL_INTEGRATIONS in env config'
  );
  test.beforeEach(
    async ({
      page,
      context,
      testedUser,
      dbAuditEvent,
      dbHealthCheckService,
      nhsLoginPages
    }) => {
      await context.clearCookies();
      await dbHealthCheckService.deleteItemByNhsNumber(testedUser.nhsNumber);
      await dbAuditEvent.deleteItemByNhsNumber(testedUser.nhsNumber);

      if (!config.integratedEnvironment) {
        await nhsLoginPages.nhsFirstPage.goToTheQuestionnaireAppURLWithLoginMock(
          (testedUser as NHSLoginMockedUser).code
        );
      } else {
        await nhsLoginPages.nhsFirstPage.goToTheQuestionnaireAppUrlAndClickContinue();
        await nhsLoginPages.nhsAppRedirectorPage.waitUntilLoadedAndClickContinue();
        await nhsLoginHelper.fillNhsLoginFormsAndWaitForNextPage(
          testedUser as NHSLoginUser,
          page
        );
      }
    }
  );

  test.afterEach('Cleaning up test data', async ({ s3Client }) => {
    await Promise.all(
      listOfEvents.map(async (event) => {
        await s3Client.deleteObjectInS3Bucket(
          reportingBucket,
          `audit-events/audit-event-${event.id}.json`
        );
      })
    );
    await s3Client.deleteObjectInS3Bucket(reportingBucket, healthCheckS3Key);
  });

  test(
    'Verify if copy of live streamed data are stored in the S3 bucket',
    {
      tag: ['@integration']
    },
    async ({
      testedUser,
      dbPatientService,
      dbHealthCheckService,
      s3Client,
      dbAuditEvent,
      taskListPage,
      completeHealthCheckFirstPage,
      termsAndConditionsPage
    }) => {
      test.slow();

      await test.step('Click start button and check if we are redirected to the Terms and Conditions page', async () => {
        await completeHealthCheckFirstPage.waitUntilLoaded();
        await completeHealthCheckFirstPage.clickStartNowBtn();
        await termsAndConditionsPage.waitUntilLoaded();
        await termsAndConditionsPage.checkAcceptTermsBoxAndClickAcceptAndContinueButton();
        await taskListPage.waitUntilLoaded();
      });

      await test.step('Check if patient record and healthCheck contains patientID', async () => {
        patient = await dbPatientService.getPatientItemByNhsNumber(
          testedUser.nhsNumber
        );
        expect(patient.patientId).toBeDefined();

        healthCheck =
          await dbHealthCheckService.getLatestHealthCheckItemsByNhsNumber(
            testedUser.nhsNumber
          );
        expect(healthCheck?.patientId as unknown as string).toEqual(
          patient.patientId
        );
        expect(healthCheck?.ageAtStart).toBeTruthy();
      });

      await test.step('Check if Health Check data were streamed into S3 bucket and contains patientID', async () => {
        healthCheckS3Key = `health-checks/health-check-${healthCheck?.id as unknown as string}.json`;

        const searchedS3ObjectExist = await s3Client.waitForAnObjectByKeyName(
          reportingBucket,
          healthCheckS3Key
        );
        expect(searchedS3ObjectExist).toBeTruthy();

        const searchedS3Object = await s3Client.waitForFileContaining(
          reportingBucket,
          healthCheckS3Key,
          patient.patientId as unknown as string
        );
        expect(searchedS3Object).toBeTruthy();
      });

      await test.step('Check if Health Check data were streamed into S3 bucket and contains ageAtStart', async () => {
        const searchedS3Object = await s3Client.waitForFileContaining(
          reportingBucket,
          healthCheckS3Key,
          `"ageAtStart"`
        );
        expect(searchedS3Object).toBeTruthy();
      });

      await test.step('Check if Audit Events were created in DB, streamed into S3 bucket and contains patientID', async () => {
        listOfEvents = await dbAuditEvent.getAllAuditEventItemsByNhsNumber(
          testedUser.nhsNumber
        );

        await Promise.all(
          listOfEvents.map(async (event) => {
            if (event.patientId) {
              expect(event?.patientId as unknown as string).toEqual(
                patient.patientId
              );

              const searchedS3EventObjectExist =
                await s3Client.waitForAnObjectByKeyName(
                  reportingBucket,
                  `audit-events/audit-event-${event.id}.json`
                );
              expect(searchedS3EventObjectExist).toBeTruthy();

              const searchedS3EventObject =
                await s3Client.waitForFileContaining(
                  reportingBucket,
                  `audit-events/audit-event-${event.id}.json`,
                  patient.patientId as unknown as string
                );
              expect(searchedS3EventObject).toBeTruthy();
            }
          })
        );
      });
    }
  );
});
