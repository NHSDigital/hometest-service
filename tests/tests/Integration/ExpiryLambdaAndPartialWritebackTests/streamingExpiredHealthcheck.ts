import { test, expect } from '../../../fixtures/commonFixture';
import { type Config, ConfigFactory } from '../../../env/config';
import { type Readable } from 'stream';
import { text } from 'node:stream/consumers';
import {
  healthCheckPropertiesExcludedFromReporting,
  questionnaireExcludedFromReporting,
  questionnaireScoresExcludedFromReporting
} from '../../../testData/reportingTestData';
import {
  HealthCheckFactory,
  HealthCheckType
} from '../../../testData/healthCheck/healthCheckFactory';
import type { IHealthCheck } from '@dnhc-health-checks/shared';

let healthCheckID: string;
let healthCheck: IHealthCheck;
let healthCheckS3Key: string;

const config: Config = ConfigFactory.getConfig();
const reportingBucket = 'reporting-data';

export default function streamingExpiredHealthCheckTest(): void {
  test.describe('Test for Live streaming data to the S3 bucket', () => {
    test.skip(
      config.autoExpiryEnabled !== true || config.reportingEnabled !== true,
      'Only runs on environments with auto expiry enabled, set autoExpiryEnabled in test config and ENABLE_AUTO_EXPIRY in env config'
    );
    test.beforeEach(
      async ({ testedUser, dynamoDBServiceUtils, dbHealthCheckService }) => {
        healthCheckID =
          await dynamoDBServiceUtils.cleanHealthCheckTableAndAddHealthCheckItem(
            testedUser,
            HealthCheckFactory.createHealthCheck(
              testedUser,
              HealthCheckType.QUESTIONNAIRE_FILLED
            )
          );

        healthCheck =
          await dbHealthCheckService.getHealthCheckItemById(healthCheckID);
      }
    );

    test.afterEach(
      'Cleaning up test data',
      async ({ s3Client, dbHealthCheckService }) => {
        await s3Client.deleteObjectInS3Bucket(
          reportingBucket,
          healthCheckS3Key
        );
        await dbHealthCheckService.deleteItemById(healthCheckID);
      }
    );

    test('Verify if HealthCheck data are available in S3 after changing step to expired', async ({
      s3Client,
      dbHealthCheckService,
      lambdaService
    }) => {
      test.slow();
      await test.step('Check if Health Check data were streamed into S3 bucket', async () => {
        healthCheckS3Key = `health-checks/health-check-${healthCheckID}.json`;

        const searchedS3Object = await s3Client.waitForAnObjectByKeyName(
          reportingBucket,
          healthCheckS3Key
        );
        expect(searchedS3Object).toBeTruthy();
      });

      await test.step('Check if step was changed to AUTO_EXPIRED in the reporting file, in S3 bucket, after HealthCheck expired', async () => {
        await dbHealthCheckService.updateHealthCheckItem(
          healthCheckID,
          'createdAt',
          '2024-05-30T11:44:29.816Z'
        );
        const response = await lambdaService.runLambdaWithParameters(
          `${config.name}NhcDataExpiryLambda`,
          {}
        );
        expect(response.$metadata.httpStatusCode).toEqual(200);

        const checkIfObjectUpdated = await s3Client.waitForFileContaining(
          reportingBucket,
          healthCheckS3Key,
          'AUTO_EXPIRED'
        );
        expect(checkIfObjectUpdated).toBeTruthy();
      });

      await test.step('Check if health check data without excluded properties is still available in S3 reporting file', async () => {
        const healthCheckS3KeyDetails = await s3Client.getS3ObjectDetails(
          reportingBucket,
          healthCheckS3Key
        );
        const payloadContents = JSON.parse(
          await text(healthCheckS3KeyDetails.Body as Readable)
        ) as IHealthCheck;

        // remove properties that shouldn't be in the report
        for (const key of questionnaireExcludedFromReporting) {
          delete healthCheck.questionnaire?.[key];
        }
        delete healthCheck.questionnaireScores?.[
          questionnaireScoresExcludedFromReporting[0]
        ];

        expect(payloadContents.id).toEqual(healthCheckID);
        for (const key of healthCheckPropertiesExcludedFromReporting) {
          expect(payloadContents).not.toContain(healthCheck[key]);
        }
        expect(payloadContents.questionnaire).toEqual(
          healthCheck.questionnaire
        );
        expect(payloadContents.questionnaireScores).toEqual(
          healthCheck.questionnaireScores
        );
      });
    });
  });
}
