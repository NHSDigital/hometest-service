import {
  type IHealthCheck,
  BloodPressureLocation,
  type IHealthCheckAnswers,
  HealthCheckSteps
} from '@dnhc-health-checks/shared';
import {
  HealthCheckStatusCalculator,
  SectionStatus,
  type TaskSectionStatus
} from '../../statuses/statusCalculator';

const calculator = new HealthCheckStatusCalculator();
const expectedTotalSectionCount = 4;

const healthCheck = {
  questionnaire: {
    hasReceivedAnInvitation: false,
    hasCompletedHealthCheckInLast5Years: false,
    hasPreExistingCondition: false,
    canCompleteHealthCheckOnline: true,
    isAboutYouSectionSubmitted: true,
    isAlcoholSectionSubmitted: true,
    isBodyMeasurementsSectionSubmitted: true,
    isPhysicalActivitySectionSubmitted: true,
    isBloodPressureSectionSubmitted: true
  },
  wasInvited: false,
  step: HealthCheckSteps.INIT
} as unknown as IHealthCheck;

const healthCheckPartial = {
  questionnaire: {
    hasReceivedAnInvitation: false,
    hasCompletedHealthCheckInLast5Years: false,
    hasPreExistingCondition: false,
    canCompleteHealthCheckOnline: true,
    isAboutYouSectionSubmitted: true,
    isAlcoholSectionSubmitted: true,
    isBodyMeasurementsSectionSubmitted: true,
    isPhysicalActivitySectionSubmitted: true,
    isBloodPressureSectionSubmitted: false
  },
  wasInvited: false,
  step: HealthCheckSteps.INIT
} as unknown as IHealthCheck;

const healthCheckInvited = {
  questionnaire: {
    canCompleteHealthCheckOnline: true
  },
  wasInvited: true,
  step: HealthCheckSteps.INIT
} as unknown as IHealthCheck;
describe('HealthCheckStatusCalculator', () => {
  describe('calculateStatus', () => {
    it('should calculate status correctly when all sections are completed', () => {
      const sections = calculator.calculateStatus(healthCheck);
      expect(sections.eligibility).toBe(SectionStatus.Completed);
      expect(sections.bloodPressure).toBe(SectionStatus.Completed);
      expect(sections.aboutYou).toBe(SectionStatus.Completed);
      expect(sections.physicalActivity).toBe(SectionStatus.Completed);
      expect(sections.alcoholConsumption).toBe(SectionStatus.Completed);
      expect(sections.bodyMeasurements).toBe(SectionStatus.Completed);
      expect(sections.reviewAndSubmit).toBe(SectionStatus.NotStarted);
      expect(sections.bloodTest).toBe(SectionStatus.CannotStartYet);

      const sectionsInvited = calculator.calculateStatus(healthCheckInvited);
      expect(sectionsInvited.eligibility).toBe(SectionStatus.Completed);
    });

    it('should show eligibility section as "not started" and every other section as "cannot start yet" when eligibility questions are not answered', () => {
      const questionnaireWithEligibilitySectionEmpty = {
        ...healthCheck.questionnaire,
        hasReceivedAnInvitation: null,
        hasPreExistingCondition: null,
        hasCompletedHealthCheckInLast5Years: null,
        canCompleteHealthCheckOnline: null
      };

      const sections = calculator.calculateStatus({
        ...healthCheck,
        questionnaire: questionnaireWithEligibilitySectionEmpty
      });

      expect(sections.eligibility).toBe(SectionStatus.NotStarted);
      expect(sections.bloodPressure).toBe(SectionStatus.CannotStartYet);
      expect(sections.aboutYou).toBe(SectionStatus.CannotStartYet);
      expect(sections.physicalActivity).toBe(SectionStatus.CannotStartYet);
      expect(sections.alcoholConsumption).toBe(SectionStatus.CannotStartYet);
      expect(sections.bodyMeasurements).toBe(SectionStatus.CannotStartYet);
      expect(sections.reviewAndSubmit).toBe(SectionStatus.CannotStartYet);
      expect(sections.bloodTest).toBe(SectionStatus.CannotStartYet);

      const sectionsInvited = calculator.calculateStatus({
        ...healthCheckInvited,
        questionnaire: {
          canCompleteHealthCheckOnline: null
        }
      });

      expect(sectionsInvited.eligibility).toBe(SectionStatus.NotStarted);
    });

    it.each([
      [false, false, false, true],
      [true, null, null, true]
    ])(
      'should show eligibility section as completed when eligibility questions are answered and user answers that they have received an invitation: %s',
      (
        hasReceivedAnInvitation: boolean,
        hasCompletedHealthCheckInLast5Years: boolean | null,
        hasPreExistingCondition: boolean | null,
        canCompleteHealthCheckOnline: boolean
      ) => {
        const questionnaireWithEligibilitySectionFilledIn = {
          ...healthCheck.questionnaire,
          hasReceivedAnInvitation,
          hasCompletedHealthCheckInLast5Years,
          hasPreExistingCondition,
          canCompleteHealthCheckOnline
        };

        const sections = calculator.calculateStatus({
          ...healthCheck,
          questionnaire: questionnaireWithEligibilitySectionFilledIn
        });

        expect(sections.eligibility).toBe(SectionStatus.Completed);
      }
    );

    it('should show eligibility section as "started" when user was invited via link', () => {
      const sectionsInvited = calculator.calculateStatus({
        ...healthCheckInvited,
        questionnaire: {
          canCompleteHealthCheckOnline: true
        }
      });

      expect(sectionsInvited.eligibility).toBe(SectionStatus.Completed);
    });

    it('should show sections as "not started" when eligibility answered and questions are not answered', () => {
      const questionnaireWithOnlyEligibilityFilledIn = {
        hasReceivedAnInvitation: false,
        hasPreExistingCondition: false,
        hasCompletedHealthCheckInLast5Years: false,
        canCompleteHealthCheckOnline: true
      };

      const sections = calculator.calculateStatus({
        ...healthCheck,
        questionnaire:
          questionnaireWithOnlyEligibilityFilledIn as IHealthCheckAnswers
      });

      expect(sections.eligibility).toBe(SectionStatus.Completed);
      expect(sections.bloodPressure).toBe(SectionStatus.CannotStartYet);
      expect(sections.aboutYou).toBe(SectionStatus.NotStarted);
      expect(sections.physicalActivity).toBe(SectionStatus.NotStarted);
      expect(sections.alcoholConsumption).toBe(SectionStatus.NotStarted);
      expect(sections.bodyMeasurements).toBe(SectionStatus.NotStarted);
      expect(sections.reviewAndSubmit).toBe(SectionStatus.CannotStartYet);
      expect(sections.bloodTest).toBe(SectionStatus.CannotStartYet);
    });

    it('should show check your blood pressure section as started when first blood pressure question answered', () => {
      const questionnaireWithCheckYourPressureSectionEmpty = {
        ...healthCheck.questionnaire,
        isBloodPressureSectionSubmitted: false,
        bloodPressureLocation: BloodPressureLocation.Monitor
      };

      const sections = calculator.calculateStatus({
        ...healthCheck,
        questionnaire: questionnaireWithCheckYourPressureSectionEmpty
      });

      expect(sections.bloodPressure).toBe(SectionStatus.Started);
    });

    it('should show check your blood pressure section as completed when check your blood pressure section marked as complete', () => {
      const questionnaireWithCheckYourPressureSectionFilledIn = {
        ...healthCheck.questionnaire,
        isBloodPressureSectionSubmitted: true
      };

      const sections = calculator.calculateStatus({
        ...healthCheck,
        questionnaire: questionnaireWithCheckYourPressureSectionFilledIn
      });

      expect(sections.bloodPressure).toBe(SectionStatus.Completed);
    });

    it('should show about you section as not started when isAboutYouSectionSubmitted is undefined', () => {
      const questionnaireWithAboutYouSectionEmpty = {
        ...healthCheck.questionnaire,
        isAboutYouSectionSubmitted: undefined
      };

      const sections = calculator.calculateStatus({
        ...healthCheck,
        questionnaire: questionnaireWithAboutYouSectionEmpty
      });

      expect(sections.aboutYou).toBe(SectionStatus.NotStarted);
    });

    it('should show about you section as started when isAboutYouSectionSubmitted is false', () => {
      const questionnaireWithAboutYouSectionFilledIn = {
        ...healthCheck.questionnaire,
        isAboutYouSectionSubmitted: false
      };

      const sections = calculator.calculateStatus({
        ...healthCheck,
        questionnaire: questionnaireWithAboutYouSectionFilledIn
      });

      expect(sections.aboutYou).toBe(SectionStatus.Started);
    });

    it('should show about you section as completed when isAboutYouSectionSubmitted is true', () => {
      const questionnaireWithAboutYouSectionFilledIn = {
        ...healthCheck.questionnaire,
        isAboutYouSectionSubmitted: true
      };

      const sections = calculator.calculateStatus({
        ...healthCheck,
        questionnaire: questionnaireWithAboutYouSectionFilledIn
      });

      expect(sections.aboutYou).toBe(SectionStatus.Completed);
    });

    it('should show bloodPressure section as NotStarted when other questionnaire questions submitted', () => {
      const healthCheckWithQuestionnairePartialCompleted = {
        ...healthCheckPartial,
        isBloodPressureSectionSubmitted: undefined
      };

      const sections = calculator.calculateStatus(
        healthCheckWithQuestionnairePartialCompleted
      );

      expect(sections.bloodPressure).toBe(SectionStatus.NotStarted);
    });

    it('should show physical activity section as not started when isPhysicalActivitySectionSubmitted is undefined', () => {
      const questionnaireWithPhysicalActivitySectionEmpty = {
        ...healthCheck.questionnaire,
        isPhysicalActivitySectionSubmitted: undefined
      };

      const sections = calculator.calculateStatus({
        ...healthCheck,
        questionnaire: questionnaireWithPhysicalActivitySectionEmpty
      });

      expect(sections.physicalActivity).toBe(SectionStatus.NotStarted);
    });

    it('should show physical activity section as started when isPhysicalActivitySectionSubmitted is false', () => {
      const questionnaireWithPhysicalActivitySectionEmpty = {
        ...healthCheck.questionnaire,
        isPhysicalActivitySectionSubmitted: false
      };

      const sections = calculator.calculateStatus({
        ...healthCheck,
        questionnaire: questionnaireWithPhysicalActivitySectionEmpty
      });

      expect(sections.physicalActivity).toBe(SectionStatus.Started);
    });

    it('should show physical activity section as completed when isPhysicalActivitySectionSubmitted is true', () => {
      const questionnaireWithPhysicalActivitySectionEmpty = {
        ...healthCheck.questionnaire,
        isPhysicalActivitySectionSubmitted: true
      };

      const sections = calculator.calculateStatus({
        ...healthCheck,
        questionnaire: questionnaireWithPhysicalActivitySectionEmpty
      });

      expect(sections.physicalActivity).toBe(SectionStatus.Completed);
    });

    it('should show alcohol consumption section as not started when isAlcoholSectionSubmitted is undefined', () => {
      const questionnaireWithAlcoholConsumptionSectionEmpty = {
        ...healthCheck.questionnaire,
        isAlcoholSectionSubmitted: undefined
      };

      const sections = calculator.calculateStatus({
        ...healthCheck,
        questionnaire: questionnaireWithAlcoholConsumptionSectionEmpty
      });

      expect(sections.alcoholConsumption).toBe(SectionStatus.NotStarted);
    });

    it('should show alcohol consumption section as started when isAlcoholSectionSubmitted is false', () => {
      const questionnaireWithAlcoholConsumptionSectionEmpty = {
        ...healthCheck.questionnaire,
        isAlcoholSectionSubmitted: false
      };

      const sections = calculator.calculateStatus({
        ...healthCheck,
        questionnaire: questionnaireWithAlcoholConsumptionSectionEmpty
      });

      expect(sections.alcoholConsumption).toBe(SectionStatus.Started);
    });

    it('should show alcohol consumption section as completed when isAlcoholSectionSubmitted is true', () => {
      const questionnaireWithAlcoholConsumptionSectionFilledIn = {
        ...healthCheck.questionnaire,
        isAlcoholSectionSubmitted: true
      };

      const sections = calculator.calculateStatus({
        ...healthCheck,
        questionnaire: questionnaireWithAlcoholConsumptionSectionFilledIn
      });

      expect(sections.alcoholConsumption).toBe(SectionStatus.Completed);
    });

    it('should show enter body measurements section as not started when isBodyMeasurementsSectionSubmitted is undefined', () => {
      const questionnaireWithBodyMeasurementsSectionEmpty = {
        ...healthCheck.questionnaire,
        isBodyMeasurementsSectionSubmitted: undefined
      };

      const sections = calculator.calculateStatus({
        ...healthCheck,
        questionnaire: questionnaireWithBodyMeasurementsSectionEmpty
      });

      expect(sections.bodyMeasurements).toBe(SectionStatus.NotStarted);
    });

    it('should show enter body measurements section as started when isBodyMeasurementsSectionSubmitted is false', () => {
      const questionnaireWithBodyMeasurementsSectionEmpty = {
        ...healthCheck.questionnaire,
        isBodyMeasurementsSectionSubmitted: false
      };

      const sections = calculator.calculateStatus({
        ...healthCheck,
        questionnaire: questionnaireWithBodyMeasurementsSectionEmpty
      });

      expect(sections.bodyMeasurements).toBe(SectionStatus.Started);
    });

    it('should show enter body measurements section as completed when isBodyMeasurementsSectionSubmitted is true', () => {
      const questionnaireWithBodyMeasurementsSectionFilledIn = {
        ...healthCheck.questionnaire,
        isBodyMeasurementsSectionSubmitted: true
      };

      const sections = calculator.calculateStatus({
        ...healthCheck,
        questionnaire: questionnaireWithBodyMeasurementsSectionFilledIn
      });

      expect(sections.bodyMeasurements).toBe(SectionStatus.Completed);
    });

    it('should show review and submit section as completed when health check step is different than INIT', () => {
      const healthCheckWithQuestionnaireSubmitted = {
        questionnaire: healthCheck.questionnaire,
        step: HealthCheckSteps.QUESTIONNAIRE_COMPLETED
      };

      const sections = calculator.calculateStatus(
        healthCheckWithQuestionnaireSubmitted as IHealthCheck
      );

      expect(sections.reviewAndSubmit).toBe(SectionStatus.Completed);
    });

    it.each([
      ['isAlcoholSectionSubmitted'],
      ['isAboutYouSectionSubmitted'],
      ['isBodyMeasurementsSectionSubmitted'],
      ['isBloodPressureSectionSubmitted'],
      ['isPhysicalActivitySectionSubmitted']
    ])(
      'should show review and submit as cannot start if one of sections is not finished',
      (question: string) => {
        const healthCheckWithUncompletedSection = {
          questionnaire: {
            ...healthCheck.questionnaire,
            [question]: false
          },
          step: HealthCheckSteps.INIT
        };

        const sections = calculator.calculateStatus(
          healthCheckWithUncompletedSection as IHealthCheck
        );

        expect(sections.reviewAndSubmit).toBe(SectionStatus.CannotStartYet);
      }
    );

    it('should show bloodTest section as NotStarted when step is QUESTIONNAIRE_COMPLETED or after', () => {
      const healthCheckWithQuestionnaireCompleted = {
        ...healthCheck,
        step: HealthCheckSteps.QUESTIONNAIRE_COMPLETED
      };

      const sections = calculator.calculateStatus(
        healthCheckWithQuestionnaireCompleted
      );

      expect(sections.bloodTest).toBe(SectionStatus.NotStarted);
    });

    it('should show bloodTest section as CannotStartYet when step is before QUESTIONNAIRE_COMPLETED', () => {
      const healthCheckBeforeQuestionnaireCompleted = {
        ...healthCheck,
        step: HealthCheckSteps.INIT
      };

      const sections = calculator.calculateStatus(
        healthCheckBeforeQuestionnaireCompleted
      );

      expect(sections.bloodTest).toBe(SectionStatus.CannotStartYet);
    });
  });

  describe('getSectionTotals', () => {
    test.each([
      [SectionStatus.NotStarted, 0],
      [SectionStatus.Started, 0],
      [SectionStatus.Completed, 0]
    ])(
      'Should not count eligibility as a proper section for progress when completed',
      (eligibility: SectionStatus, expectedNumberSectionsComplete: number) => {
        // arrange
        const sections: TaskSectionStatus = {
          eligibility,
          aboutYou: SectionStatus.NotStarted,
          physicalActivity: SectionStatus.NotStarted,
          alcoholConsumption: SectionStatus.NotStarted,
          bodyMeasurements: SectionStatus.NotStarted,
          bloodPressure: SectionStatus.NotStarted,
          reviewAndSubmit: SectionStatus.NotStarted,
          bloodTest: SectionStatus.NotStarted
        };

        // act
        const result = calculator.getSectionTotals(sections);

        // assert
        expect(result.complete).toBe(expectedNumberSectionsComplete);
        expect(result.total).toBe(expectedTotalSectionCount);
      }
    );

    test.each([
      [
        SectionStatus.NotStarted,
        SectionStatus.NotStarted,
        SectionStatus.NotStarted,
        SectionStatus.NotStarted,
        0
      ], // eligibility completed only, not counted as task list section
      [
        SectionStatus.Completed,
        SectionStatus.NotStarted,
        SectionStatus.NotStarted,
        SectionStatus.NotStarted,
        0
      ], // about you complete only
      [
        SectionStatus.NotStarted,
        SectionStatus.Completed,
        SectionStatus.NotStarted,
        SectionStatus.NotStarted,
        0
      ], // physical activity complete only
      [
        SectionStatus.NotStarted,
        SectionStatus.NotStarted,
        SectionStatus.Completed,
        SectionStatus.NotStarted,
        0
      ], // alcohol complete only
      [
        SectionStatus.NotStarted,
        SectionStatus.NotStarted,
        SectionStatus.NotStarted,
        SectionStatus.Completed,
        0
      ], // body measurements complete only
      [
        SectionStatus.Started,
        SectionStatus.NotStarted,
        SectionStatus.Completed,
        SectionStatus.Completed,
        0
      ], // mix of complete with other statuses #1
      [
        SectionStatus.NotStarted,
        SectionStatus.Completed,
        SectionStatus.NotStarted,
        SectionStatus.Completed,
        0
      ], // mix of complete with other statuses #2
      [
        SectionStatus.Completed,
        SectionStatus.Started,
        SectionStatus.Completed,
        SectionStatus.Completed,
        0
      ], // mix of complete with other statuses #3
      [
        SectionStatus.Completed,
        SectionStatus.Completed,
        SectionStatus.Completed,
        SectionStatus.Completed,
        1
      ] // all questionnaire complete
    ])(
      'Should correctly count "questionnaire" when subsections sections are complete',
      (
        aboutYou: SectionStatus,
        physicalActivity: SectionStatus,
        alcoholConsumption: SectionStatus,
        bodyMeasurements: SectionStatus,
        expectedNumberSectionsComplete: number
      ) => {
        // arrange
        const sections: TaskSectionStatus = {
          eligibility: SectionStatus.Completed,
          aboutYou,
          physicalActivity,
          alcoholConsumption,
          bodyMeasurements,
          bloodPressure: SectionStatus.NotStarted,
          reviewAndSubmit: SectionStatus.NotStarted,
          bloodTest: SectionStatus.NotStarted
        };

        // act
        const result = calculator.getSectionTotals(sections);

        // assert
        expect(result.complete).toBe(expectedNumberSectionsComplete);
        expect(result.total).toBe(expectedTotalSectionCount);
      }
    );

    test.each([
      [SectionStatus.NotStarted, 1],
      [SectionStatus.Started, 1],
      [SectionStatus.Completed, 2]
    ])(
      'Should correctly count "blood pressure" when blood pressure section complete',
      (
        bloodPressureStatus: SectionStatus,
        expectedNumberSectionsComplete: number
      ) => {
        // arrange
        const sections: TaskSectionStatus = {
          eligibility: SectionStatus.Completed,
          aboutYou: SectionStatus.Completed,
          physicalActivity: SectionStatus.Completed,
          alcoholConsumption: SectionStatus.Completed,
          bodyMeasurements: SectionStatus.Completed,
          bloodPressure: bloodPressureStatus,
          reviewAndSubmit: SectionStatus.CannotStartYet,
          bloodTest: SectionStatus.CannotStartYet
        };

        // act
        const result = calculator.getSectionTotals(sections);

        // assert
        expect(result.complete).toBe(expectedNumberSectionsComplete);
        expect(result.total).toBe(expectedTotalSectionCount);
      }
    );

    test.each([
      [SectionStatus.NotStarted, 2],
      [SectionStatus.Started, 2],
      [SectionStatus.Completed, 3]
    ])(
      'Should correctly count "review and submit" when section complete',
      (
        reviewAndSubmit: SectionStatus,
        expectedNumberSectionsComplete: number
      ) => {
        // arrange
        const sections: TaskSectionStatus = {
          eligibility: SectionStatus.Completed,
          aboutYou: SectionStatus.Completed,
          physicalActivity: SectionStatus.Completed,
          alcoholConsumption: SectionStatus.Completed,
          bodyMeasurements: SectionStatus.Completed,
          bloodPressure: SectionStatus.Completed,
          reviewAndSubmit: reviewAndSubmit,
          bloodTest: SectionStatus.CannotStartYet
        };

        // act
        const result = calculator.getSectionTotals(sections);

        // assert
        expect(result.complete).toBe(expectedNumberSectionsComplete);
        expect(result.total).toBe(expectedTotalSectionCount);
      }
    );

    test.each([
      [SectionStatus.NotStarted, 3],
      [SectionStatus.Started, 3],
      [SectionStatus.Completed, 4]
    ])(
      'Should correctly count "blood test" when section complete',
      (bloodTest: SectionStatus, expectedNumberSectionsComplete: number) => {
        // arrange
        const sections: TaskSectionStatus = {
          eligibility: SectionStatus.Completed,
          aboutYou: SectionStatus.Completed,
          physicalActivity: SectionStatus.Completed,
          alcoholConsumption: SectionStatus.Completed,
          bodyMeasurements: SectionStatus.Completed,
          bloodPressure: SectionStatus.Completed,
          reviewAndSubmit: SectionStatus.Completed,
          bloodTest
        };

        // act
        const result = calculator.getSectionTotals(sections);

        // assert
        expect(result.complete).toBe(expectedNumberSectionsComplete);
        expect(result.total).toBe(expectedTotalSectionCount);
      }
    );
  });
});
