import { test, expect } from '../../fixtures/commonFixture';
import DbTownsendScoreService from '../../lib/aws/dynamoDB/DbTownsendScoreService';
import { AuditEventType } from '@dnhc-health-checks/shared';
import {
  HealthCheckFactory,
  HealthCheckType
} from '../../testData/healthCheck/healthCheckFactory';

let healthCheckId: string;

test.beforeEach(
  async ({ testedUser, dynamoDBServiceUtils, dbAuditEvent, config }) => {
    healthCheckId =
      await dynamoDBServiceUtils.cleanHealthCheckTableAndAddHealthCheckItem(
        testedUser,
        HealthCheckFactory.createHealthCheck(
          testedUser,
          HealthCheckType.QUESTIONNAIRE_FILLED
        )
      );
    await dbAuditEvent.deleteItemByNhsNumber(testedUser.nhsNumber);
    const service = new DbTownsendScoreService(
      config.name,
      config.townsendTableName as string
    );
    await service.createTownsendScoreItem({
      postcode: 'FY83SY',
      deprivationScore: '-3.83'
    });
  }
);

test.afterEach(
  'Deleting a health check item and Townsend item from Db after tests',
  async ({ testedUser, dbHealthCheckService }) => {
    await dbHealthCheckService.deleteItemByNhsNumber(testedUser.nhsNumber);
  }
);
[
  {
    postcode: 'FY8 3SY',
    description: 'valid postcode from dataset',
    event: AuditEventType.DeprivationPostcodeFound,
    score: '-3.83'
  },
  {
    postcode: 'M1 1AB',
    description: 'valid postcode which is not in dataset',
    event: AuditEventType.DeprivationPostcodeNotFound,
    score: null
  },
  {
    postcode: '',
    description: 'empty postcode field',
    event: AuditEventType.DeprivationPostcodeNone,
    score: null
  }
].forEach(({ postcode, description, event, score }) => {
  test(
    `Check if townsend score is calculated correctly for scenario ${description}`,
    {
      tag: ['@ui', '@aboutYou', '@regression']
    },
    async ({
      taskListPage,
      aboutYouPages,
      testedUser,
      dbAuditEvent,
      dbHealthCheckService
    }) => {
      const testStartDate = new Date().toISOString();
      await test.step('Go to townsend Postcode page', async () => {
        await taskListPage.goToTaskListPageAndWaitForLoading();
        await taskListPage.clickAboutYouLink();
        await aboutYouPages.townsendPostcodePage.waitUntilLoaded();
      });
      await test.step(`Test ${description}`, async () => {
        await aboutYouPages.townsendPostcodePage.fillPostcodeField(postcode);
        await aboutYouPages.townsendPostcodePage.clickContinueButton();
        await aboutYouPages.familyHeartAttackHistoryPage.waitUntilLoaded();
      });
      await test.step(`Test if ${event} event was created`, async () => {
        const lastMessage =
          await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
            testedUser.nhsNumber,
            `${event}`,
            testStartDate
          );
        expect(lastMessage).toBeTruthy();
      });
      await test.step(`Test if townsend score was updated correctly`, async () => {
        const dbItem =
          await dbHealthCheckService.getHealthCheckItemById(healthCheckId);
        expect(dbItem.questionnaireScores?.townsendScore).toEqual(score);
        console.log(
          'townsend score equal to: ' +
            dbItem.questionnaireScores?.townsendScore
        );
      });
    }
  );
});
