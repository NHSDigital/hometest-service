import type { IEligibility, IHealthCheck } from '@dnhc-health-checks/shared';
import { StepManager, DestinationActionCheck } from '../StepManager';
import { JourneyStepNames } from '../../lib/models/route-paths';
import {
  HealthCheckStatusCalculator,
  SectionStatus
} from '../../statuses/statusCalculator';

export const create = (
  healthCheckAnswers: IEligibility,
  wasInvited: boolean | undefined
): StepManager => {
  const firstStep = generateEligibilitySectionFirstStep(wasInvited);
  const stepManager = new StepManager(firstStep);

  stepManager.addStep(JourneyStepNames.ReceivedInvitationQueryPage, [
    new DestinationActionCheck(
      JourneyStepNames.PreviousHealthCheckCompletedQueryPage,
      () => healthCheckAnswers.hasReceivedAnInvitation === false
    ),
    new DestinationActionCheck(
      JourneyStepNames.WhoShouldNotUseOnlineServicePage,
      () => healthCheckAnswers.hasReceivedAnInvitation === true
    )
  ]);

  stepManager.addStep(JourneyStepNames.PreviousHealthCheckCompletedQueryPage, [
    new DestinationActionCheck(
      JourneyStepNames.PreexistingHealthConditionsPage,
      () => healthCheckAnswers.hasCompletedHealthCheckInLast5Years === false
    ),
    new DestinationActionCheck(
      JourneyStepNames.SorryCannotGetHealthCheckWithPreviousHealthcheckCompleted,
      () => healthCheckAnswers.hasCompletedHealthCheckInLast5Years === true
    )
  ]);

  stepManager.addStep(JourneyStepNames.PreexistingHealthConditionsPage, [
    new DestinationActionCheck(
      JourneyStepNames.WhoShouldNotUseOnlineServicePage,
      () => healthCheckAnswers.hasPreExistingCondition === false
    ),
    new DestinationActionCheck(
      JourneyStepNames.SorryCannotGetHealthCheckWithPreexistingConditionPage,
      () => healthCheckAnswers.hasPreExistingCondition === true
    )
  ]);

  stepManager.addStep(JourneyStepNames.WhoShouldNotUseOnlineServicePage, [
    new DestinationActionCheck(
      JourneyStepNames.ExtendedExclusionsShutterPage,
      () => healthCheckAnswers.canCompleteHealthCheckOnline === false
    )
  ]);

  return stepManager;
};

export function generateEligibilitySectionFirstStep(
  wasInvited: boolean | undefined
): string {
  return wasInvited
    ? JourneyStepNames.WhoShouldNotUseOnlineServicePage
    : JourneyStepNames.ReceivedInvitationQueryPage;
}

export function isEligibilitySectionCompleted(
  healthCheck: IHealthCheck
): boolean {
  const statusCalculator = new HealthCheckStatusCalculator();
  const sections = statusCalculator.calculateStatus(healthCheck);
  return sections.eligibility === SectionStatus.Completed;
}
