/**
 * This file defines the conditions for displaying shutter pages based on the user's health check answers.
 * Each condition checks specific criteria in the health check questionnaire to determine if a shutter page should be shown.
 * The conditions are used by the route guard to control access to different parts of the application.
 */
import {
  shutterConditions,
  type ShutterConditionKey
} from '@dnhc-health-checks/shared/utils/shutter-conditions';
import { JourneyStepNames, RoutePath } from '../models/route-paths';
import { type IHealthCheckAnswers } from '@dnhc-health-checks/shared';

export interface ShutterAction {
  check: (questionnaire: IHealthCheckAnswers) => boolean;
  navigation: NavigationAction;
}

interface NavigationAction {
  route: RoutePath;
  step: JourneyStepNames;
}

const uiActions: Record<ShutterConditionKey, NavigationAction> = {
  lowBloodPressureSymptoms: {
    route: RoutePath.BloodPressureJourney,
    step: JourneyStepNames.LowBloodPressureShutterPage
  },
  highBloodPressure: {
    route: RoutePath.BloodPressureJourney,
    step: JourneyStepNames.BloodPressureVeryHighShutterPage
  },
  diabetes: {
    route: RoutePath.BodyMeasurementsJourney,
    step: JourneyStepNames.DiabetesShutterPage
  }
};

export const shutterActions: ShutterAction[] = shutterConditions.map(
  (condition) => ({
    check: condition.check,
    navigation: uiActions[condition.key]
  })
);
