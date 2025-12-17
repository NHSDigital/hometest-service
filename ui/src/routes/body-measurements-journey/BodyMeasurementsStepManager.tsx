import { JourneyStepNames } from '../../lib/models/route-paths';
import { DestinationActionCheck, StepManager } from '../StepManager';

export const LEICESTER_RISK_SCORE_THRESHOLD = 16;

export const create = (): StepManager => {
  const stepManager = new StepManager(JourneyStepNames.HeightPage);

  stepManager.addStep(JourneyStepNames.HeightPage, [
    new DestinationActionCheck(JourneyStepNames.WeightPage)
  ]);

  stepManager.addStep(JourneyStepNames.WeightPage, [
    new DestinationActionCheck(JourneyStepNames.MeasureYourWaistPage)
  ]);

  stepManager.addStep(JourneyStepNames.MeasureYourWaistPage, [
    new DestinationActionCheck(JourneyStepNames.WaistMeasurementPage)
  ]);

  stepManager.addStep(JourneyStepNames.WaistMeasurementPage, [
    new DestinationActionCheck(
      JourneyStepNames.CheckYourAnswersBodyMeasurementsPage
    )
  ]);

  return stepManager;
};
