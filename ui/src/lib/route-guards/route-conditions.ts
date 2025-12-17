/**
 * This file defines the route access conditions for logged-in users.
 * Each route in the application is associated with a condition that determines
 * whether the user can access the route based on their health check status and patient info.
 * The conditions are used by the route guard to control access to different parts of the application.
 */
import { RoutePath } from '../models/route-paths';
import {
  type IHealthCheck,
  HealthCheckSteps,
  isStepBefore,
  isStepEqualOrAfter
} from '@dnhc-health-checks/shared';
import {
  HealthCheckStatusCalculator,
  SectionStatus
} from '../../statuses/statusCalculator';
import { isEligibilitySectionCompleted } from '../../routes/eligibility-journey/EligibilityStepManager';

type RouteConditionsMap = {
  [K in RoutePath]: {
    canAccess?: (healthCheck: IHealthCheck) => boolean;
  };
};

export const routeConditionsForLoggedUser: RouteConditionsMap = {
  [RoutePath.HomePage]: {
    canAccess: () => false
  },
  [RoutePath.StartHealthCheckPage]: {
    canAccess: (healthCheck) => healthCheck == null
  },
  [RoutePath.TermsAndConditions]: {
    canAccess: () => false
  },
  [RoutePath.HealthCheckVersionMigration]: {
    canAccess: () => false
  },
  [RoutePath.TaskListPage]: {
    canAccess: (healthCheck) =>
      healthCheck !== null &&
      isEligibilitySectionCompleted(healthCheck) &&
      healthCheck.step !== HealthCheckSteps.AUTO_EXPIRED &&
      isStepBefore(healthCheck.step, HealthCheckSteps.LAB_ORDERS_SCHEDULED)
  },
  [RoutePath.EligibilityJourney]: {
    canAccess: (healthCheck) =>
      healthCheck.step === HealthCheckSteps.INIT &&
      !isEligibilitySectionCompleted(healthCheck)
  },
  [RoutePath.AboutYouJourney]: {
    canAccess: (healthCheck) =>
      healthCheck.step === HealthCheckSteps.INIT &&
      new HealthCheckStatusCalculator().calculateStatus(healthCheck)
        .aboutYou !== SectionStatus.CannotStartYet
  },
  [RoutePath.PhysicalActivityJourney]: {
    canAccess: (healthCheck) =>
      healthCheck.step === HealthCheckSteps.INIT &&
      new HealthCheckStatusCalculator().calculateStatus(healthCheck)
        .physicalActivity !== SectionStatus.CannotStartYet
  },
  [RoutePath.AlcoholConsumptionJourney]: {
    canAccess: (healthCheck) =>
      healthCheck.step === HealthCheckSteps.INIT &&
      new HealthCheckStatusCalculator().calculateStatus(healthCheck)
        .alcoholConsumption !== SectionStatus.CannotStartYet
  },
  [RoutePath.BodyMeasurementsJourney]: {
    canAccess: (healthCheck) =>
      healthCheck.step === HealthCheckSteps.INIT &&
      new HealthCheckStatusCalculator().calculateStatus(healthCheck)
        .bodyMeasurements !== SectionStatus.CannotStartYet
  },
  [RoutePath.BloodPressureJourney]: {
    canAccess: (healthCheck) =>
      healthCheck.step === HealthCheckSteps.INIT &&
      new HealthCheckStatusCalculator().calculateStatus(healthCheck)
        .bloodPressure !== SectionStatus.CannotStartYet
  },
  [RoutePath.CheckAndSubmitYourAnswersPage]: {
    canAccess: (healthCheck) =>
      healthCheck.step === HealthCheckSteps.INIT &&
      new HealthCheckStatusCalculator().calculateStatus(healthCheck)
        .reviewAndSubmit !== SectionStatus.CannotStartYet
  },
  [RoutePath.BloodTestJourney]: {
    canAccess: (healthCheck) =>
      healthCheck.step === HealthCheckSteps.QUESTIONNAIRE_COMPLETED &&
      new HealthCheckStatusCalculator().calculateStatus(healthCheck)
        .bloodTest !== SectionStatus.CannotStartYet
  },
  [RoutePath.MainResultsPage]: {
    canAccess: (healthCheck) =>
      isStepEqualOrAfter(healthCheck.step, HealthCheckSteps.GP_UPDATE_SUCCESS)
  },
  [RoutePath.BMIResultsPage]: {
    canAccess: (healthCheck) =>
      isStepEqualOrAfter(healthCheck.step, HealthCheckSteps.GP_UPDATE_SUCCESS)
  },
  [RoutePath.BloodPressureResultsPage]: {
    canAccess: (healthCheck) =>
      isStepEqualOrAfter(healthCheck.step, HealthCheckSteps.GP_UPDATE_SUCCESS)
  },
  [RoutePath.DiabetesRiskResultsPage]: {
    canAccess: (healthCheck) =>
      isStepEqualOrAfter(healthCheck.step, HealthCheckSteps.GP_UPDATE_SUCCESS)
  },
  [RoutePath.CholesterolResultsPage]: {
    canAccess: (healthCheck) =>
      isStepEqualOrAfter(healthCheck.step, HealthCheckSteps.GP_UPDATE_SUCCESS)
  },
  [RoutePath.AlcoholResultsPage]: {
    canAccess: (healthCheck) =>
      isStepEqualOrAfter(healthCheck.step, HealthCheckSteps.GP_UPDATE_SUCCESS)
  },
  [RoutePath.SmokingResultsPage]: {
    canAccess: (healthCheck) =>
      isStepEqualOrAfter(healthCheck.step, HealthCheckSteps.GP_UPDATE_SUCCESS)
  },
  [RoutePath.PhysicalActivityResultsPage]: {
    canAccess: (healthCheck) =>
      isStepEqualOrAfter(healthCheck.step, HealthCheckSteps.GP_UPDATE_SUCCESS)
  },
  [RoutePath.DementiaPage]: {
    canAccess: (healthCheck) =>
      isStepEqualOrAfter(healthCheck.step, HealthCheckSteps.GP_UPDATE_SUCCESS)
  },
  // These pages are not protected by the route guard
  [RoutePath.AboutThisSoftwarePage]: {},
  [RoutePath.NotEligiblePage]: {},
  [RoutePath.OdsNhsNumberNotEligiblePage]: {},
  [RoutePath.HealthCheckExpiredPage]: {},
  [RoutePath.BloodTestDataExpiredShutterPage]: {},
  [RoutePath.SingleSignOnPage]: {},
  [RoutePath.LoginCallbackPage]: {},
  [RoutePath.SessionTimedOutPage]: {},
  [RoutePath.UnexpectedErrorPage]: {},
  [RoutePath.ConsentNotGivenErrorPage]: {},
  [RoutePath.NhsLoginErrorPage]: {},
  [RoutePath.LogoutPage]: {}
};
