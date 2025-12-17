import { test, expect } from '../../fixtures/commonFixture';
import { type Config, ConfigFactory } from '../../env/config';
import { type AuditEventItem } from '../../lib/aws/dynamoDB/DbAuditEventService';
import { text } from 'node:stream/consumers';
import { type Readable } from 'stream';
import {
  healthyHealthCheckQuestionnaire,
  healthyHealthCheckQuestionnaireScores
} from '../../testData/questionnairesTestData';
import type { IHealthCheck, IImdScore } from '@dnhc-health-checks/shared';
import { HealthCheckBuilder } from '../../testData/healthCheck/healthCheckBuilder';
import {
  AlcoholConsumptionSectionDataFactory,
  AlcoholConsumptionSectionDataType
} from '../../lib/flows/AlcoholConsumptionSection/AlcoholConsumptionSectionDataFactory';
import { AlcoholConsumptionSectionFlow } from '../../lib/flows/AlcoholConsumptionSection/AlcoholConsumptionSectionFlow';

let listOfEvents: AuditEventItem[];
let healthCheckS3Key: string;
let healthCheckID: string;

const config: Config = ConfigFactory.getConfig();
const reportingBucket = 'reporting-data';
const lsoaImdData: IImdScore = {
  decile: 5,
  rank: 15535,
  score: 18.648
};

test.describe('Test for Live streaming data to the S3 bucket', () => {
  test.skip(
    config.reportingEnabled !== true,
    'Only runs on environments with reporting enabled, set reportingEnabled in test config and ENABLE_REPORTING_DATA_COPY and ENABLE_REPORTING_EXTERNAL_INTEGRATIONS in env config'
  );
  test.beforeEach(
    async ({ testedUser, dbAuditEvent, dynamoDBServiceUtils }) => {
      const healthCheckToCreate = new HealthCheckBuilder(testedUser)
        .withQuestionnaire(healthyHealthCheckQuestionnaire())
        .withQuestionnaireScores(
          healthyHealthCheckQuestionnaireScores({
            imd: lsoaImdData
          })
        )
        .build();
      healthCheckID =
        await dynamoDBServiceUtils.cleanHealthCheckTableAndAddHealthCheckItem(
          testedUser,
          healthCheckToCreate
        );
      await dbAuditEvent.deleteItemByNhsNumber(testedUser.nhsNumber);
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

  test('Verify if copy of live streamed data are stored in the S3 bucket', async ({
    testedUser,
    s3Client,
    dbAuditEvent,
    taskListPage,
    page
  }) => {
    test.slow();
    await taskListPage.goToTaskListPageAndWaitForLoading();

    await test.step('Check if Health Check data were streamed into S3 bucket', async () => {
      healthCheckS3Key = `health-checks/health-check-${healthCheckID}.json`;

      const searchedS3Object = await s3Client.waitForAnObjectByKeyName(
        reportingBucket,
        healthCheckS3Key
      );
      expect(searchedS3Object).toBeTruthy();
    });

    await test.step('Check if Lsoa IMD data are available in the healthCheck reporting file', async () => {
      const payloadFile = await s3Client.getS3ObjectDetails(
        reportingBucket,
        healthCheckS3Key
      );
      const payloadContents = JSON.parse(
        await text(payloadFile.Body as Readable)
      ) as IHealthCheck;

      expect(payloadContents?.questionnaireScores?.imd?.decile).toEqual(
        lsoaImdData.decile
      );
      expect(payloadContents?.questionnaireScores?.imd?.rank).toEqual(
        lsoaImdData.rank
      );
      expect(payloadContents?.questionnaireScores?.imd?.score).toEqual(
        lsoaImdData.score
      );
    });

    await test.step('Check if Audit Events were created in DB for tested user and data were streamed into S3 bucket', async () => {
      listOfEvents = await dbAuditEvent.getAllAuditEventItemsByNhsNumber(
        testedUser.nhsNumber
      );

      await Promise.all(
        listOfEvents.map(async (event) => {
          const searchedS3Object = await s3Client.waitForAnObjectByKeyName(
            reportingBucket,
            `audit-events/audit-event-${event.id}.json`
          );
          expect(searchedS3Object).toBeTruthy();
        })
      );
    });

    await test.step(`Check if Audit Events reporting files doesn't contains nhsNumber`, async () => {
      await Promise.all(
        listOfEvents.map(async (event) => {
          const payloadFile = await s3Client.getS3ObjectDetails(
            reportingBucket,
            `audit-events/audit-event-${event.id}.json`
          );

          const payload = payloadFile.Body;
          expect(payload).toBeDefined();
          const payloadContents = await text(payload as Readable);
          expect(payloadContents).not.toContain(testedUser.nhsNumber);
          if (event.patientId) {
            expect(payloadContents).toContain(event.patientId);
          }
        })
      );
    });

    await test.step('Check if S3 file for Health Check was updated in the S3 bucket', async () => {
      const healthCheckS3KeyDetails = await s3Client.getS3ObjectDetails(
        reportingBucket,
        healthCheckS3Key
      );

      const data = new AlcoholConsumptionSectionDataFactory(
        AlcoholConsumptionSectionDataType.HEAVY_DRINKING
      ).getData();
      await new AlcoholConsumptionSectionFlow(
        data,
        page,
        false
      ).completeSection();
      await taskListPage.waitUntilLoaded();

      const checkIfObjectUpdated = await s3Client.waitForAnObjectUpdate(
        reportingBucket,
        healthCheckS3Key,
        healthCheckS3KeyDetails.LastModified as unknown as string
      );
      expect(checkIfObjectUpdated).toBeTruthy();

      const healthCheckS3KeyUpdatedDetails = await s3Client.getS3ObjectDetails(
        reportingBucket,
        healthCheckS3Key
      );

      expect(
        (healthCheckS3KeyUpdatedDetails.ContentLength as unknown as number) >
          (healthCheckS3KeyDetails.ContentLength as unknown as number)
      ).toBeTruthy();
    });
  });
});
