import {
  AuditCategory,
  AlcoholDailyUnits,
  AlcoholEventsFrequency,
  AlcoholHowOften,
  AlcoholPersonInjuredAndConcernedRelative,
  DoYouDrinkAlcohol,
  type IHealthCheckAnswers
} from '@dnhc-health-checks/shared';
import {
  calculateAuditScore,
  doesExceedBasicQuestionsScore
} from '../../../../src/lib/score-calculator/alcohol-journey/alcohol-score-calculator';

const testCases = [
  {
    scenario: 'no answer for "do you drink"',
    drinkAlcohol: undefined,
    expectedResult: false,
    expectedResults: {
      inProgressAuditScore: null,
      auditScore: null,
      auditCategory: null
    }
  },
  {
    scenario: 'used to drink - score 0 - not submitted',
    drinkAlcohol: DoYouDrinkAlcohol.UsedTo,
    alcoholHowOften: AlcoholHowOften.Never,
    alcoholDailyUnits: AlcoholDailyUnits.ZeroToTwo,
    alcoholMultipleDrinksOneOccasion: AlcoholEventsFrequency.Never,
    expectedResult: false,
    expectedResults: {
      inProgressAuditScore: 0,
      auditScore: null,
      auditCategory: null
    }
  },
  {
    scenario: 'used to drink - score 0 - no risk',
    drinkAlcohol: DoYouDrinkAlcohol.UsedTo,
    alcoholHowOften: AlcoholHowOften.Never,
    alcoholDailyUnits: AlcoholDailyUnits.ZeroToTwo,
    alcoholMultipleDrinksOneOccasion: AlcoholEventsFrequency.Never,
    isAlcoholSectionSubmitted: true,
    expectedResult: false,
    expectedResults: {
      inProgressAuditScore: null,
      auditScore: 0,
      auditCategory: AuditCategory.NoRisk
    }
  },
  {
    scenario: 'used to drink - score 3 - low risk',
    drinkAlcohol: DoYouDrinkAlcohol.UsedTo,
    alcoholHowOften: AlcoholHowOften.MonthlyOrLess,
    alcoholDailyUnits: AlcoholDailyUnits.ThreeToFour,
    alcoholMultipleDrinksOneOccasion: AlcoholEventsFrequency.LessThanMonthly,
    isAlcoholSectionSubmitted: true,
    expectedResult: false,
    expectedResults: {
      inProgressAuditScore: null,
      auditScore: 3,
      auditCategory: AuditCategory.LowRisk
    }
  },
  {
    scenario: 'used to drink - score 8 - increasing risk',
    drinkAlcohol: DoYouDrinkAlcohol.UsedTo,
    alcoholHowOften: AlcoholHowOften.TwoToFourTimesAMonth,
    alcoholDailyUnits: AlcoholDailyUnits.FiveToSix,
    alcoholMultipleDrinksOneOccasion: AlcoholEventsFrequency.Monthly,
    alcoholConcernedRelative:
      AlcoholPersonInjuredAndConcernedRelative.YesNotPastYear,
    isAlcoholSectionSubmitted: true,
    expectedResult: true,
    expectedResults: {
      inProgressAuditScore: null,
      auditScore: 8,
      auditCategory: AuditCategory.IncreasingRisk
    }
  },
  {
    scenario: 'used to drink - score 16 - high risk',
    drinkAlcohol: DoYouDrinkAlcohol.UsedTo,
    alcoholHowOften: AlcoholHowOften.FourTimesOrMoreAWeek,
    alcoholDailyUnits: AlcoholDailyUnits.TenOrMore,
    alcoholMultipleDrinksOneOccasion: AlcoholEventsFrequency.DailyOrAlmost,
    alcoholConcernedRelative:
      AlcoholPersonInjuredAndConcernedRelative.YesDuringPastYear,
    alcoholPersonInjured: AlcoholPersonInjuredAndConcernedRelative.No,
    isAlcoholSectionSubmitted: true,
    expectedResult: true,
    expectedResults: {
      inProgressAuditScore: null,
      auditScore: 16,
      auditCategory: AuditCategory.HighRisk
    }
  },
  {
    scenario: 'used to drink - score 24 - possible dependency',
    drinkAlcohol: DoYouDrinkAlcohol.UsedTo,
    alcoholHowOften: AlcoholHowOften.FourTimesOrMoreAWeek,
    alcoholDailyUnits: AlcoholDailyUnits.TenOrMore,
    alcoholMultipleDrinksOneOccasion: AlcoholEventsFrequency.DailyOrAlmost,
    alcoholConcernedRelative:
      AlcoholPersonInjuredAndConcernedRelative.YesDuringPastYear,
    alcoholPersonInjured:
      AlcoholPersonInjuredAndConcernedRelative.YesDuringPastYear,
    alcoholFailedObligations: AlcoholEventsFrequency.DailyOrAlmost,
    isAlcoholSectionSubmitted: true,
    expectedResult: true,
    expectedResults: {
      inProgressAuditScore: null,
      auditScore: 24,
      auditCategory: AuditCategory.PossibleDependency
    }
  }
];

describe('doesExceedBasicQuestionsScore', () => {
  test.each(testCases)(
    'should return $expectedResult for exceeding score threshold - $scenario',
    ({
      drinkAlcohol,
      alcoholHowOften,
      alcoholDailyUnits,
      alcoholMultipleDrinksOneOccasion,
      expectedResult
    }) => {
      const healthCheckAnswers: IHealthCheckAnswers = {
        drinkAlcohol,
        alcoholHowOften,
        alcoholDailyUnits,
        alcoholMultipleDrinksOneOccasion
      };

      const result = doesExceedBasicQuestionsScore(healthCheckAnswers);

      expect(result).toBe(expectedResult);
    }
  );
});

describe('calculateAuditScore', () => {
  test.each(testCases)(
    'should return expected scores or categories - $scenario',
    ({
      drinkAlcohol,
      alcoholHowOften,
      alcoholDailyUnits,
      alcoholMultipleDrinksOneOccasion,
      alcoholConcernedRelative,
      alcoholPersonInjured,
      alcoholFailedObligations,
      isAlcoholSectionSubmitted,
      expectedResults
    }) => {
      const healthCheckAnswers: IHealthCheckAnswers = {
        drinkAlcohol,
        alcoholHowOften,
        alcoholDailyUnits,
        alcoholMultipleDrinksOneOccasion,
        alcoholConcernedRelative,
        alcoholPersonInjured,
        alcoholFailedObligations,
        isAlcoholSectionSubmitted
      };

      const result = calculateAuditScore(healthCheckAnswers);

      expect(result).toEqual(expectedResults);
    }
  );
});
