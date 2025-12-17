import { doesExceedAlcoholScore } from './alcoholScoreHelper';
import {
  DoYouDrinkAlcohol,
  type IAlcoholConsumption
} from '@dnhc-health-checks/shared';
import { JourneyStepNames } from '../../lib/models/route-paths';
import { DestinationActionCheck, StepManager } from '../StepManager';

export const create = (
  healthCheckAnswers: IAlcoholConsumption,
  auditScore: number
): StepManager => {
  const stepManager = new StepManager(JourneyStepNames.AlcoholQuestionPage);

  stepManager.addStep(JourneyStepNames.AlcoholQuestionPage, [
    new DestinationActionCheck(
      JourneyStepNames.CheckYourAnswersAlcoholPage,
      () => healthCheckAnswers.drinkAlcohol === DoYouDrinkAlcohol.Never
    ),
    new DestinationActionCheck(
      JourneyStepNames.AlcoholOftenPage,
      () =>
        healthCheckAnswers.drinkAlcohol === DoYouDrinkAlcohol.UsedTo ||
        healthCheckAnswers.drinkAlcohol === DoYouDrinkAlcohol.Yes
    )
  ]);

  stepManager.addStep(JourneyStepNames.AlcoholOftenPage, [
    new DestinationActionCheck(JourneyStepNames.AlcoholTypicalUnitsPage)
  ]);

  stepManager.addStep(JourneyStepNames.AlcoholTypicalUnitsPage, [
    new DestinationActionCheck(JourneyStepNames.AlcoholOccasionUnitsPage)
  ]);

  stepManager.addStep(JourneyStepNames.AlcoholOccasionUnitsPage, [
    new DestinationActionCheck(JourneyStepNames.AlcoholStopPage, () =>
      doesExceedAlcoholScore(auditScore)
    ),
    new DestinationActionCheck(JourneyStepNames.CheckYourAnswersAlcoholPage)
  ]);

  stepManager.addStep(JourneyStepNames.AlcoholStopPage, [
    new DestinationActionCheck(JourneyStepNames.AlcoholFailPage)
  ]);

  stepManager.addStep(JourneyStepNames.AlcoholFailPage, [
    new DestinationActionCheck(JourneyStepNames.AlcoholMorningDrinkPage)
  ]);

  stepManager.addStep(JourneyStepNames.AlcoholMorningDrinkPage, [
    new DestinationActionCheck(JourneyStepNames.AlcoholGuiltPage)
  ]);

  stepManager.addStep(JourneyStepNames.AlcoholGuiltPage, [
    new DestinationActionCheck(JourneyStepNames.AlcoholMemoryLossPage)
  ]);

  stepManager.addStep(JourneyStepNames.AlcoholMemoryLossPage, [
    new DestinationActionCheck(JourneyStepNames.AlcoholPersonInjuredPage)
  ]);

  stepManager.addStep(JourneyStepNames.AlcoholPersonInjuredPage, [
    new DestinationActionCheck(JourneyStepNames.AlcoholConcernedRelativePage)
  ]);

  stepManager.addStep(JourneyStepNames.AlcoholConcernedRelativePage, [
    new DestinationActionCheck(JourneyStepNames.CheckYourAnswersAlcoholPage)
  ]);

  return stepManager;
};
