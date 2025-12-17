import {
  type IHealthCheck,
  HealthCheckSteps,
  isStepEqualOrAfter,
  type IHealthCheckAnswers,
  type IHealthCheckBloodTestOrder
} from '@dnhc-health-checks/shared';

export enum SectionStatus {
  CannotStartYet = 'Cannot start yet',
  Completed = 'Completed',
  NotStarted = 'Not started',
  Started = 'Started'
}

export interface TaskSectionStatus {
  eligibility: SectionStatus;
  bloodPressure: SectionStatus;
  aboutYou: SectionStatus;
  physicalActivity: SectionStatus;
  alcoholConsumption: SectionStatus;
  bodyMeasurements: SectionStatus;
  reviewAndSubmit: SectionStatus;
  bloodTest: SectionStatus;
}

export interface TaskSectionTotals {
  complete: number;
  total: number;
}

export class HealthCheckStatusCalculator {
  calculateStatus(healthCheck: IHealthCheck): TaskSectionStatus {
    const eligibility: SectionStatus = calculateEligibilitySectionStatus(
      healthCheck.questionnaire,
      healthCheck.wasInvited
    );

    const aboutYou: SectionStatus = calculateAboutYouSectionStatus(
      healthCheck.questionnaire,
      eligibility
    );
    const physicalActivity: SectionStatus =
      calculatePhysicalActivitySectionStatus(
        healthCheck.questionnaire,
        eligibility
      );
    const alcoholConsumption: SectionStatus = calculateAlcoholSectionStatus(
      healthCheck.questionnaire,
      eligibility
    );
    const bodyMeasurements: SectionStatus =
      calculateBodyMeasurementsSectionStatus(
        healthCheck.questionnaire,
        eligibility
      );
    const bloodPressure: SectionStatus = calculateBloodPressureSectionStatus(
      healthCheck.questionnaire,
      {
        eligibility,
        aboutYou,
        physicalActivity,
        alcoholConsumption,
        bodyMeasurements
      }
    );
    const reviewAndSubmit: SectionStatus = calculateReviewAndSubmit(
      healthCheck.step,
      {
        eligibility,
        bloodPressure,
        aboutYou,
        physicalActivity,
        alcoholConsumption,
        bodyMeasurements
      }
    );
    const bloodTest: SectionStatus = calculateOrderBloodTestKit(
      healthCheck.step,
      healthCheck.bloodTestOrder
    );

    return {
      eligibility,
      bloodPressure,
      aboutYou,
      physicalActivity,
      alcoholConsumption,
      bodyMeasurements,
      reviewAndSubmit,
      bloodTest
    };
  }

  getSectionTotals(sections: TaskSectionStatus): TaskSectionTotals {
    const sectionsGrouped = [
      [
        sections.aboutYou,
        sections.physicalActivity,
        sections.alcoholConsumption,
        sections.bodyMeasurements
      ],
      [sections.bloodPressure],
      [sections.reviewAndSubmit],
      [sections.bloodTest]
    ];

    const completedGroups = sectionsGrouped.filter((group) =>
      group.every((x) => x === SectionStatus.Completed)
    );

    return {
      complete: completedGroups.length,
      total: sectionsGrouped.length
    };
  }
}

function calculateEligibilitySectionStatus(
  questionnaire: Partial<IHealthCheckAnswers>,
  wasInvited: boolean | undefined
): SectionStatus {
  if (
    wasInvited === true &&
    questionnaire.canCompleteHealthCheckOnline === true
  ) {
    return SectionStatus.Completed;
  }
  if (
    !wasInvited &&
    questionnaire.hasReceivedAnInvitation === true &&
    questionnaire.canCompleteHealthCheckOnline === true
  ) {
    return SectionStatus.Completed;
  }
  if (
    !wasInvited &&
    questionnaire.hasReceivedAnInvitation === false &&
    questionnaire.hasCompletedHealthCheckInLast5Years === false &&
    questionnaire.hasPreExistingCondition === false &&
    questionnaire.canCompleteHealthCheckOnline === true
  ) {
    return SectionStatus.Completed;
  }
  if (
    (wasInvited &&
      arePopulated([questionnaire.canCompleteHealthCheckOnline])) ||
    (!wasInvited && arePopulated([questionnaire.hasReceivedAnInvitation]))
  ) {
    return SectionStatus.Started;
  }
  return SectionStatus.NotStarted;
}

function calculateAboutYouSectionStatus(
  questionnaire: Partial<IHealthCheckAnswers>,
  eligibilitySectionStatus: SectionStatus
): SectionStatus {
  if (eligibilitySectionStatus !== SectionStatus.Completed) {
    return SectionStatus.CannotStartYet;
  }
  return getSectionStatusBasedOnIsSectionSubmittedFlag(
    questionnaire.isAboutYouSectionSubmitted as boolean | undefined
  );
}

function calculatePhysicalActivitySectionStatus(
  questionnaire: Partial<IHealthCheckAnswers>,
  eligibilitySectionStatus: SectionStatus
): SectionStatus {
  if (eligibilitySectionStatus !== SectionStatus.Completed) {
    return SectionStatus.CannotStartYet;
  }

  return getSectionStatusBasedOnIsSectionSubmittedFlag(
    questionnaire?.isPhysicalActivitySectionSubmitted as boolean | undefined
  );
}

function calculateAlcoholSectionStatus(
  questionnaire: Partial<IHealthCheckAnswers>,
  eligibilitySectionStatus: SectionStatus
): SectionStatus {
  if (eligibilitySectionStatus !== SectionStatus.Completed) {
    return SectionStatus.CannotStartYet;
  }
  return getSectionStatusBasedOnIsSectionSubmittedFlag(
    questionnaire.isAlcoholSectionSubmitted as boolean | undefined
  );
}

function calculateBodyMeasurementsSectionStatus(
  questionnaire: Partial<IHealthCheckAnswers>,
  eligibilitySectionStatus: SectionStatus
): SectionStatus {
  if (eligibilitySectionStatus !== SectionStatus.Completed) {
    return SectionStatus.CannotStartYet;
  }
  return getSectionStatusBasedOnIsSectionSubmittedFlag(
    questionnaire.isBodyMeasurementsSectionSubmitted as boolean | undefined
  );
}

function calculateReviewAndSubmit(
  healthCheckStep: HealthCheckSteps,
  taskSectionStatus: Partial<TaskSectionStatus>
) {
  if (healthCheckStep === HealthCheckSteps.QUESTIONNAIRE_COMPLETED) {
    return SectionStatus.Completed;
  }
  const isQuestionnaireCompleted = areCompleted([
    taskSectionStatus.eligibility,
    taskSectionStatus.bloodPressure,
    taskSectionStatus.aboutYou,
    taskSectionStatus.alcoholConsumption,
    taskSectionStatus.physicalActivity,
    taskSectionStatus.bodyMeasurements
  ]);

  return isQuestionnaireCompleted
    ? SectionStatus.NotStarted
    : SectionStatus.CannotStartYet;
}
function calculateBloodPressureSectionStatus(
  questionnaire: Partial<IHealthCheckAnswers>,
  taskSectionStatus: Partial<TaskSectionStatus>
): SectionStatus {
  const prerequisitesCompleted = areCompleted([
    taskSectionStatus.eligibility,
    taskSectionStatus.aboutYou,
    taskSectionStatus.alcoholConsumption,
    taskSectionStatus.physicalActivity,
    taskSectionStatus.bodyMeasurements
  ]);
  if (prerequisitesCompleted === false) {
    return SectionStatus.CannotStartYet;
  }
  if (questionnaire.isBloodPressureSectionSubmitted === true) {
    return SectionStatus.Completed;
  }

  const hasStartedBloodPressureSection =
    questionnaire.bloodPressureLocation !== undefined;

  if (hasStartedBloodPressureSection) {
    return SectionStatus.Started;
  }

  return SectionStatus.NotStarted;
}

function calculateOrderBloodTestKit(
  currentHealthCheckStep: HealthCheckSteps,
  bloodTestOrder: IHealthCheckBloodTestOrder | undefined
) {
  if (
    bloodTestOrder?.isBloodTestSectionSubmitted !== undefined &&
    bloodTestOrder?.isBloodTestSectionSubmitted !== null
  ) {
    return SectionStatus.Started;
  }

  const isQuestionnaireCompleted = isStepEqualOrAfter(
    currentHealthCheckStep,
    HealthCheckSteps.QUESTIONNAIRE_COMPLETED
  );

  return isQuestionnaireCompleted
    ? SectionStatus.NotStarted
    : SectionStatus.CannotStartYet;
}

function areCompleted(sections: Array<SectionStatus | undefined>) {
  return sections.every((section) => section === SectionStatus.Completed);
}

function arePopulated<T>(answers: Array<T>): boolean {
  return answers.every((answer: T) => answer !== null && answer !== undefined);
}

function getSectionStatusBasedOnIsSectionSubmittedFlag(
  isSectionSubmitted: boolean | undefined
): SectionStatus {
  if (isSectionSubmitted === true) {
    return SectionStatus.Completed;
  }
  if (isSectionSubmitted === false) {
    return SectionStatus.Started;
  }
  return SectionStatus.NotStarted;
}
