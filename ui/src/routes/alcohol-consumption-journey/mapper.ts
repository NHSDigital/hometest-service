import {
  type IHealthCheck,
  type IAlcoholConsumption
} from '@dnhc-health-checks/shared';

export function mapToAlcoholConsumption(
  healthCheck: IHealthCheck
): IAlcoholConsumption {
  return {
    drinkAlcohol: healthCheck.questionnaire?.drinkAlcohol,
    alcoholHowOften: healthCheck.questionnaire?.alcoholHowOften,
    alcoholDailyUnits: healthCheck.questionnaire?.alcoholDailyUnits,
    alcoholConcernedRelative:
      healthCheck.questionnaire?.alcoholConcernedRelative,
    alcoholFailedObligations:
      healthCheck.questionnaire?.alcoholFailedObligations,
    alcoholGuilt: healthCheck.questionnaire?.alcoholGuilt,
    alcoholMemoryLoss: healthCheck.questionnaire?.alcoholMemoryLoss,
    alcoholMorningDrink: healthCheck.questionnaire?.alcoholMorningDrink,
    alcoholMultipleDrinksOneOccasion:
      healthCheck.questionnaire?.alcoholMultipleDrinksOneOccasion,
    alcoholPersonInjured: healthCheck.questionnaire?.alcoholPersonInjured,
    alcoholCannotStop: healthCheck.questionnaire?.alcoholCannotStop
  } as IAlcoholConsumption;
}
