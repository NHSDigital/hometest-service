import { test, expect } from '../../fixtures/commonFixture';
import {
  AuditEventType,
  type IHealthCheckAnswers
} from '@dnhc-health-checks/shared';
import {
  AlcoholDailyUnits,
  AlcoholEventsFrequency,
  AlcoholHowOften,
  AlcoholPersonInjuredAndConcernedRelative,
  DoYouDrinkAlcohol
} from '../../lib/enum/health-check-answers';
import { AlcoholConsumptionSectionFlow } from '../../lib/flows/AlcoholConsumptionSection/AlcoholConsumptionSectionFlow';
import {
  AlcoholConsumptionSectionDataFactory,
  AlcoholConsumptionSectionDataType
} from '../../lib/flows/AlcoholConsumptionSection/AlcoholConsumptionSectionDataFactory';
import {
  HealthCheckFactory,
  HealthCheckType
} from '../../testData/healthCheck/healthCheckFactory';

test.beforeEach(async ({ testedUser, dbAuditEvent, dynamoDBServiceUtils }) => {
  await dynamoDBServiceUtils.cleanHealthCheckTableAndAddHealthCheckItem(
    testedUser,
    HealthCheckFactory.createHealthCheck(
      testedUser,
      HealthCheckType.QUESTIONNAIRE_FILLED
    )
  );
  await dbAuditEvent.deleteItemByNhsNumber(testedUser.nhsNumber);
});

test(
  'Alcohol Consumption happy path',
  {
    tag: ['@ui', '@happyPath', '@alcoholConsumption', '@regression']
  },
  async ({
    taskListPage,
    testedUser,
    dbAuditEvent,
    dynamoDBServiceUtils,
    page
  }) => {
    test.slow();
    const testStartDate = new Date().toISOString();
    await test.step('Go to task list page', async () => {
      await taskListPage.goToTaskListPageAndWaitForLoading();
    });

    await test.step('Complete Alcohol Consumption section', async () => {
      const data = new AlcoholConsumptionSectionDataFactory(
        AlcoholConsumptionSectionDataType.MEDIUM_DRINKING
      ).getData();
      await new AlcoholConsumptionSectionFlow(data, page).completeSection();
    });

    await test.step('Check if SectionStartAlcoholConsumption event was created in DB', async () => {
      const lastMessage =
        await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
          testedUser.nhsNumber,
          AuditEventType.SectionStartAlcoholConsumption,
          testStartDate
        );
      expect(lastMessage).toBeTruthy();
    });

    await test.step('Check Alcohol Consumption section data were stored in DB', async () => {
      const alcoholConsumptionData: {
        question: keyof IHealthCheckAnswers;
        answer: string;
      }[] = [
        {
          question: 'drinkAlcohol',
          answer: DoYouDrinkAlcohol.Yes
        },
        {
          question: 'alcoholHowOften',
          answer: AlcoholHowOften.FourTimesOrMoreAWeek
        },
        {
          question: 'alcoholDailyUnits',
          answer: AlcoholDailyUnits.SevenToNine
        },
        {
          question: 'alcoholMultipleDrinksOneOccasion',
          answer: AlcoholEventsFrequency.DailyOrAlmost
        },
        {
          question: 'alcoholCannotStop',
          answer: AlcoholEventsFrequency.Monthly
        },
        {
          question: 'alcoholFailedObligations',
          answer: AlcoholEventsFrequency.Monthly
        },
        {
          question: 'alcoholMorningDrink',
          answer: AlcoholEventsFrequency.Monthly
        },
        {
          question: 'alcoholGuilt',
          answer: AlcoholEventsFrequency.Monthly
        },
        {
          question: 'alcoholMemoryLoss',
          answer: AlcoholEventsFrequency.Monthly
        },
        {
          question: 'alcoholPersonInjured',
          answer: AlcoholPersonInjuredAndConcernedRelative.No
        },
        {
          question: 'alcoholConcernedRelative',
          answer: AlcoholPersonInjuredAndConcernedRelative.No
        }
      ];

      for (const { question, answer } of alcoholConsumptionData) {
        expect(
          await dynamoDBServiceUtils.checkQuestionnaireAnswerWasStoredInDatabase(
            question,
            answer,
            testedUser
          ),
          `Question ${question} with answer ${answer} was not stored properly in DB`
        ).toBeTruthy();
      }

      await taskListPage.waitUntilLoaded();
    });

    await test.step('Check if SectionCompleteAlcoholConsumption event was created in DB after completing section', async () => {
      const lastMessage =
        await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
          testedUser.nhsNumber,
          AuditEventType.SectionCompleteAlcoholConsumption,
          testStartDate
        );
      expect(lastMessage).toBeTruthy();
    });
  }
);
