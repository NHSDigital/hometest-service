import { StepManager, DestinationActionCheck } from '../StepManager';
import { type IBloodPressure } from '@dnhc-health-checks/shared';
import { JourneyStepNames } from '../../lib/models/route-paths';
import { bloodPressureChecker } from './blood-pressure-checker';
import {
  shouldShowHighBloodPressureShutterPage,
  shouldShowLowBloodPressureShutterPage
} from '@dnhc-health-checks/shared/utils/shutter-conditions';

export const create = (healthCheckAnswers: IBloodPressure): StepManager => {
  const stepManager = new StepManager(JourneyStepNames.BloodPressureCheckPage);

  stepManager.addStep(JourneyStepNames.BloodPressureCheckPage, [
    new DestinationActionCheck(JourneyStepNames.BloodPressureLocationPage)
  ]);

  stepManager.addStep(JourneyStepNames.BloodPressureLocationPage, [
    new DestinationActionCheck(JourneyStepNames.EnterBloodPressurePage)
  ]);

  stepManager.addStep(JourneyStepNames.EnterBloodPressurePage, [
    new DestinationActionCheck(
      JourneyStepNames.ConfirmBloodPressureReadingPage,
      () =>
        bloodPressureChecker.isBloodPressureLow(healthCheckAnswers) ||
        bloodPressureChecker.isBloodPressureVeryHigh(healthCheckAnswers)
    ),
    new DestinationActionCheck(JourneyStepNames.ConfirmBloodPressurePage)
  ]);

  stepManager.addStep(JourneyStepNames.ConfirmBloodPressureReadingPage, [
    new DestinationActionCheck(
      JourneyStepNames.LowBloodPressureSymptomsPage,
      () => healthCheckAnswers.lowBloodPressureValuesConfirmed === true
    ),
    new DestinationActionCheck(
      JourneyStepNames.BloodPressureVeryHighShutterPage,
      () => shouldShowHighBloodPressureShutterPage(healthCheckAnswers)
    ),
    new DestinationActionCheck(JourneyStepNames.EnterBloodPressurePage)
  ]);

  stepManager.addStep(JourneyStepNames.LowBloodPressureSymptomsPage, [
    new DestinationActionCheck(
      JourneyStepNames.LowBloodPressureShutterPage,
      () => shouldShowLowBloodPressureShutterPage(healthCheckAnswers)
    ),
    new DestinationActionCheck(JourneyStepNames.ConfirmBloodPressurePage)
  ]);

  return stepManager;
};
