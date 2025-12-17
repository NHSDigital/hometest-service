import { type AlcoholAuditScoreTestData } from '../lib/apiClients/HealthCheckModel';
import {
  AlcoholDailyUnits,
  AlcoholEventsFrequency,
  AlcoholHowOften,
  AlcoholPersonInjuredAndConcernedRelative,
  DoYouDrinkAlcohol
} from '../lib/enum/health-check-answers';

export function getAlcoholAuditScoreNoRiskResult(): AlcoholAuditScoreTestData {
  return {
    alcoholGuilt: null,
    alcoholMultipleDrinksOneOccasion: null,
    drinkAlcohol: DoYouDrinkAlcohol.Never,
    alcoholCannotStop: null,
    alcoholHowOften: null,
    alcoholMorningDrink: null,
    alcoholPersonInjured: null,
    alcoholConcernedRelative: null,
    alcoholDailyUnits: null,
    alcoholFailedObligations: null,
    alcoholMemoryLoss: null,
    isAlcoholSectionSubmitted: false
  };
}

export function getAlcoholAuditScoreLowRiskResult(): AlcoholAuditScoreTestData {
  return {
    alcoholGuilt: null,
    alcoholMultipleDrinksOneOccasion: AlcoholEventsFrequency.Never,
    drinkAlcohol: DoYouDrinkAlcohol.UsedTo,
    alcoholCannotStop: null,
    alcoholHowOften: AlcoholHowOften.MonthlyOrLess,
    alcoholMorningDrink: null,
    alcoholPersonInjured: null,
    alcoholConcernedRelative: null,
    alcoholDailyUnits: AlcoholDailyUnits.ZeroToTwo,
    alcoholFailedObligations: null,
    alcoholMemoryLoss: null,
    isAlcoholSectionSubmitted: false
  };
}

export function getAlcoholAuditScoreIncreasingRiskResult(): AlcoholAuditScoreTestData {
  return {
    alcoholGuilt: AlcoholEventsFrequency.Never,
    alcoholMultipleDrinksOneOccasion: AlcoholEventsFrequency.Never,
    drinkAlcohol: DoYouDrinkAlcohol.Yes,
    alcoholCannotStop: AlcoholEventsFrequency.Never,
    alcoholHowOften: AlcoholHowOften.FourTimesOrMoreAWeek,
    alcoholMorningDrink: AlcoholEventsFrequency.Never,
    alcoholPersonInjured: AlcoholPersonInjuredAndConcernedRelative.No,
    alcoholConcernedRelative: AlcoholPersonInjuredAndConcernedRelative.No,
    alcoholDailyUnits: AlcoholDailyUnits.TenOrMore,
    alcoholFailedObligations: AlcoholEventsFrequency.Never,
    alcoholMemoryLoss: AlcoholEventsFrequency.Never,
    isAlcoholSectionSubmitted: false
  };
}

export function getAlcoholAuditScoreHighRiskResult(): AlcoholAuditScoreTestData {
  return {
    alcoholGuilt: AlcoholEventsFrequency.Never,
    alcoholMultipleDrinksOneOccasion: AlcoholEventsFrequency.DailyOrAlmost,
    drinkAlcohol: DoYouDrinkAlcohol.UsedTo,
    alcoholCannotStop: AlcoholEventsFrequency.DailyOrAlmost,
    alcoholHowOften: AlcoholHowOften.FourTimesOrMoreAWeek,
    alcoholMorningDrink: AlcoholEventsFrequency.Never,
    alcoholPersonInjured: AlcoholPersonInjuredAndConcernedRelative.No,
    alcoholConcernedRelative: AlcoholPersonInjuredAndConcernedRelative.No,
    alcoholDailyUnits: AlcoholDailyUnits.TenOrMore,
    alcoholFailedObligations: AlcoholEventsFrequency.Never,
    alcoholMemoryLoss: AlcoholEventsFrequency.Never,
    isAlcoholSectionSubmitted: false
  };
}

export function getAlcoholAuditScorePossibleDependencyRiskResult(): AlcoholAuditScoreTestData {
  return {
    alcoholGuilt: AlcoholEventsFrequency.Never,
    alcoholMultipleDrinksOneOccasion: AlcoholEventsFrequency.DailyOrAlmost,
    drinkAlcohol: DoYouDrinkAlcohol.UsedTo,
    alcoholCannotStop: AlcoholEventsFrequency.DailyOrAlmost,
    alcoholHowOften: AlcoholHowOften.FourTimesOrMoreAWeek,
    alcoholMorningDrink: AlcoholEventsFrequency.Never,
    alcoholPersonInjured: AlcoholPersonInjuredAndConcernedRelative.No,
    alcoholConcernedRelative: AlcoholPersonInjuredAndConcernedRelative.No,
    alcoholDailyUnits: AlcoholDailyUnits.TenOrMore,
    alcoholFailedObligations: AlcoholEventsFrequency.DailyOrAlmost,
    alcoholMemoryLoss: AlcoholEventsFrequency.Never,
    isAlcoholSectionSubmitted: false
  };
}

export function getAlcoholAuditTestCases(): Array<{
  riskCategoryTestData: AlcoholAuditScoreTestData;
  riskCategory: string;
  riskScore: number;
}> {
  return [
    {
      riskCategoryTestData: getAlcoholAuditScoreNoRiskResult(),
      riskCategory: 'NoRisk',
      riskScore: 0
    },
    {
      riskCategoryTestData: getAlcoholAuditScoreLowRiskResult(),
      riskCategory: 'LowRisk',
      riskScore: 1
    },
    {
      riskCategoryTestData: getAlcoholAuditScoreIncreasingRiskResult(),
      riskCategory: 'IncreasingRisk',
      riskScore: 8
    },
    {
      riskCategoryTestData: getAlcoholAuditScoreHighRiskResult(),
      riskCategory: 'HighRisk',
      riskScore: 16
    },
    {
      riskCategoryTestData: getAlcoholAuditScorePossibleDependencyRiskResult(),
      riskCategory: 'PossibleDependency',
      riskScore: 20
    }
  ];
}
