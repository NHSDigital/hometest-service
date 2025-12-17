import { JourneyStepNames } from '../../lib/models/route-paths';
import { DestinationActionCheck, StepManager } from '../StepManager';

export const create = (): StepManager => {
  const stepManager = new StepManager(JourneyStepNames.HoursExercisedPage);

  stepManager.addStep(JourneyStepNames.HoursExercisedPage, [
    new DestinationActionCheck(JourneyStepNames.HoursWalkedPage)
  ]);

  stepManager.addStep(JourneyStepNames.HoursWalkedPage, [
    new DestinationActionCheck(JourneyStepNames.WalkingPacePage)
  ]);

  stepManager.addStep(JourneyStepNames.WalkingPacePage, [
    new DestinationActionCheck(JourneyStepNames.HoursCycledPage)
  ]);

  stepManager.addStep(JourneyStepNames.HoursCycledPage, [
    new DestinationActionCheck(JourneyStepNames.WorkActivityPage)
  ]);

  stepManager.addStep(JourneyStepNames.WorkActivityPage, [
    new DestinationActionCheck(JourneyStepNames.EverydayMovementPage)
  ]);

  stepManager.addStep(JourneyStepNames.EverydayMovementPage, [
    new DestinationActionCheck(JourneyStepNames.HoursHouseworkPage)
  ]);

  stepManager.addStep(JourneyStepNames.HoursHouseworkPage, [
    new DestinationActionCheck(JourneyStepNames.HoursGardeningPage)
  ]);

  stepManager.addStep(JourneyStepNames.HoursGardeningPage, [
    new DestinationActionCheck(
      JourneyStepNames.CheckYourAnswersPagePhysicalActivity
    )
  ]);

  return stepManager;
};
