import { test, expect } from '../../fixtures/commonFixture';
import { type LsoaImdItem } from '../../lib/aws/dynamoDB/DbLsoaImdService';
import { AuditEventType } from '@dnhc-health-checks/shared';
import {
  HealthCheckFactory,
  HealthCheckType
} from '../../testData/healthCheck/healthCheckFactory';

let healthCheckId: string;
const lsoaImdDataToCreate: LsoaImdItem = {
  lsoaCode: 'E01004294',
  imdDecile: 5,
  imdRank: 15535,
  imdScore: 18.648
};
const postcodeLsoaItem = {
  postcode: 'E18RD',
  lsoaCode: 'E01004294'
};
const nonExistingLsoaPostcode = 'BT7 1XX';
const lsoaVersion = '2011';
const imdVersion = '2019';

test.describe('LSOA Postcode and LSOA IMD data correctly retrieved', () => {
  test.beforeEach(
    async ({
      testedUser,
      dynamoDBServiceUtils,
      dbAuditEvent,
      dbPostcodeLsoaService,
      dbLsoaImdService
    }) => {
      healthCheckId =
        await dynamoDBServiceUtils.cleanHealthCheckTableAndAddHealthCheckItem(
          testedUser,
          HealthCheckFactory.createHealthCheck(
            testedUser,
            HealthCheckType.QUESTIONNAIRE_FILLED
          )
        );
      await dbAuditEvent.deleteItemByNhsNumber(testedUser.nhsNumber);
      await dbPostcodeLsoaService.createPostcodeLsoaItem(postcodeLsoaItem);

      await dbLsoaImdService.createLsoaImdItem(lsoaImdDataToCreate);
    }
  );

  test(
    'Lsoa Poscode and LsoaImd items found in the db',
    {
      tag: ['@ui', '@integration', '@lsoa']
    },
    async ({
      taskListPage,
      aboutYouPages,
      dbAuditEvent,
      dbHealthCheckService,
      testedUser
    }) => {
      const testStartDate = new Date().toISOString();

      await test.step(`Check if LsoaPostcodeFound event was created after finding postcode in the PostcodeLsoa db table`, async () => {
        await taskListPage.goToTaskListPageAndWaitForLoading();
        await taskListPage.clickAboutYouLink();
        await aboutYouPages.townsendPostcodePage.waitUntilLoaded();
        await aboutYouPages.townsendPostcodePage.fillPostcodeField(
          postcodeLsoaItem.postcode
        );
        await aboutYouPages.townsendPostcodePage.clickContinueButton();

        const lastMessage =
          await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
            testedUser.nhsNumber,
            AuditEventType.LsoaPostcodeFound,
            testStartDate
          );
        expect(lastMessage).toBeTruthy();
        expect(lastMessage?.details?.lsoaVersion).toEqual(lsoaVersion);
      });

      await test.step(`Check if ImdLsoaFound event was created after finding postcode in the LsoaImd item db table`, async () => {
        const lastMessage =
          await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
            testedUser.nhsNumber,
            AuditEventType.ImdLsoaFound,
            testStartDate
          );
        expect(lastMessage).toBeTruthy();
        expect(lastMessage?.details?.lsoaVersion).toEqual(lsoaVersion);
        expect(lastMessage?.details?.imdVersion).toEqual(imdVersion);
      });

      await test.step(`Check if IMD data are available in the questionnaireScore, in HealthCheck`, async () => {
        const dbHealthCheckItem =
          await dbHealthCheckService.getHealthCheckItemById(healthCheckId);

        expect(dbHealthCheckItem?.questionnaireScores?.imd?.decile).toEqual(
          lsoaImdDataToCreate.imdDecile
        );
        expect(dbHealthCheckItem?.questionnaireScores?.imd?.rank).toEqual(
          lsoaImdDataToCreate.imdRank
        );
        expect(dbHealthCheckItem?.questionnaireScores?.imd?.score).toEqual(
          lsoaImdDataToCreate.imdScore
        );
      });

      await test.step(`Check if LsoaPostcodeNotFound event was created after not finding postcode in the PostcodeLsoa db table`, async () => {
        await taskListPage.goToTaskListPageAndWaitForLoading();
        await taskListPage.clickAboutYouLink();
        await aboutYouPages.townsendPostcodePage.waitUntilLoaded();
        await aboutYouPages.townsendPostcodePage.fillPostcodeField(
          nonExistingLsoaPostcode
        );
        await aboutYouPages.townsendPostcodePage.clickContinueButton();

        const lastMessage =
          await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
            testedUser.nhsNumber,
            AuditEventType.LsoaPostcodeNotFound,
            testStartDate
          );
        expect(lastMessage).toBeTruthy();
        expect(lastMessage?.details?.lsoaVersion).toEqual(lsoaVersion);
      });

      await test.step(`Check if IMD data are overridden in the questionnaireScore in HealthCheck`, async () => {
        const dbHealthCheckItem =
          await dbHealthCheckService.getHealthCheckItemById(healthCheckId);
        expect(dbHealthCheckItem?.questionnaireScores?.imd).toEqual(null);
        expect(dbHealthCheckItem?.questionnaire?.postcode).toEqual(
          nonExistingLsoaPostcode
        );
      });
    }
  );
});

test.describe('LSOA IMD data were not correctly retrieved', () => {
  test.beforeEach(
    async ({
      testedUser,
      dynamoDBServiceUtils,
      dbAuditEvent,
      dbPostcodeLsoaService,
      dbLsoaImdService
    }) => {
      healthCheckId =
        await dynamoDBServiceUtils.cleanHealthCheckTableAndAddHealthCheckItem(
          testedUser,
          HealthCheckFactory.createHealthCheck(
            testedUser,
            HealthCheckType.QUESTIONNAIRE_FILLED
          )
        );
      await dbAuditEvent.deleteItemByNhsNumber(testedUser.nhsNumber);
      await dbPostcodeLsoaService.createPostcodeLsoaItem(postcodeLsoaItem);
      await dbLsoaImdService.deleteLsoaImdItemByLsoaCode(
        lsoaImdDataToCreate.lsoaCode
      );
    }
  );

  test.afterEach(async ({ dbLsoaImdService }) => {
    await dbLsoaImdService.createLsoaImdItem(lsoaImdDataToCreate);
  });

  test(
    'Lsoa Poscode item found in the db, but no LsoaImd item found for the lsoaCode',
    {
      tag: ['@ui', '@integration', '@lsoa']
    },
    async ({
      taskListPage,
      aboutYouPages,
      dbAuditEvent,
      dbHealthCheckService,
      testedUser
    }) => {
      const testStartDate = new Date().toISOString();

      await test.step(`Check if LsoaPostcodeFound event was created after finding postcode in the PostcodeLsoa db table`, async () => {
        await taskListPage.goToTaskListPageAndWaitForLoading();
        await taskListPage.clickAboutYouLink();
        await aboutYouPages.townsendPostcodePage.waitUntilLoaded();
        await aboutYouPages.townsendPostcodePage.fillPostcodeField(
          postcodeLsoaItem.postcode
        );
        await aboutYouPages.townsendPostcodePage.clickContinueButton();

        const lastMessage =
          await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
            testedUser.nhsNumber,
            AuditEventType.LsoaPostcodeFound,
            testStartDate
          );
        expect(lastMessage).toBeTruthy();
        expect(lastMessage?.details?.lsoaVersion).toEqual(lsoaVersion);
      });

      await test.step(`Check if ImdLsoaNotFound event was created after not finding the LsoaImd item for lsoaCode connected with postcode`, async () => {
        const lastMessage =
          await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
            testedUser.nhsNumber,
            AuditEventType.ImdLsoaNotFound,
            testStartDate
          );
        expect(lastMessage).toBeTruthy();
        expect(lastMessage?.details?.lsoaVersion).toEqual(lsoaVersion);
        expect(lastMessage?.details?.imdVersion).toEqual(imdVersion);
      });

      await test.step(`Check if IMD data are null in the questionnaireScore in HealthCheck`, async () => {
        const dbHealthCheckItem =
          await dbHealthCheckService.getHealthCheckItemById(healthCheckId);
        expect(dbHealthCheckItem?.questionnaireScores?.imd).toEqual(null);
      });
    }
  );
});
