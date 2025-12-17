import {
  HealthCheckSteps,
  isStepBefore,
  isStepEqualOrAfter
} from '@dnhc-health-checks/shared';

describe('isStepEqualOrAfter tests', () => {
  it.each([
    [HealthCheckSteps.INIT, HealthCheckSteps.INIT],
    [
      HealthCheckSteps.QUESTIONNAIRE_COMPLETED,
      HealthCheckSteps.QUESTIONNAIRE_COMPLETED
    ],
    [HealthCheckSteps.LAB_ORDERS_PLACED, HealthCheckSteps.LAB_ORDERS_PLACED],
    [
      HealthCheckSteps.LAB_RESULTS_RECEIVED,
      HealthCheckSteps.LAB_RESULTS_RECEIVED
    ],
    [
      HealthCheckSteps.RISK_SCORES_CALCULATED,
      HealthCheckSteps.RISK_SCORES_CALCULATED
    ]
  ])(
    'should return true if the steps are the same: %s and %s',
    (currentStep: HealthCheckSteps, otherStep: HealthCheckSteps) => {
      expect(isStepEqualOrAfter(currentStep, otherStep)).toBe(true);
    }
  );

  it.each([
    [HealthCheckSteps.QUESTIONNAIRE_COMPLETED, HealthCheckSteps.INIT],
    [
      HealthCheckSteps.LAB_ORDERS_PLACED,
      HealthCheckSteps.QUESTIONNAIRE_COMPLETED
    ],
    [HealthCheckSteps.LAB_RESULTS_RECEIVED, HealthCheckSteps.LAB_ORDERS_PLACED],
    [HealthCheckSteps.LAB_RESULTS_RECEIVED, HealthCheckSteps.LAB_ORDERS_PLACED],
    [
      HealthCheckSteps.RISK_SCORES_CALCULATED,
      HealthCheckSteps.RISK_SCORES_CALCULATED
    ]
  ])(
    'should return true if the step %s is after the step %s',
    (currentStep: HealthCheckSteps, otherStep: HealthCheckSteps) => {
      expect(isStepEqualOrAfter(currentStep, otherStep)).toBe(true);
    }
  );

  it.each([
    [HealthCheckSteps.INIT, HealthCheckSteps.QUESTIONNAIRE_COMPLETED],
    [
      HealthCheckSteps.QUESTIONNAIRE_COMPLETED,
      HealthCheckSteps.LAB_ORDERS_PLACED
    ],
    [HealthCheckSteps.LAB_ORDERS_PLACED, HealthCheckSteps.LAB_RESULTS_RECEIVED],
    [
      HealthCheckSteps.LAB_RESULTS_RECEIVED,
      HealthCheckSteps.RISK_SCORES_CALCULATED
    ]
  ])(
    'should return false if the step %s is before the step %s',
    (currentStep: HealthCheckSteps, otherStep: HealthCheckSteps) => {
      expect(isStepEqualOrAfter(currentStep, otherStep)).toBe(false);
    }
  );
});

describe('isStepBefore tests', () => {
  it.each([
    [HealthCheckSteps.INIT, HealthCheckSteps.QUESTIONNAIRE_COMPLETED],
    [
      HealthCheckSteps.QUESTIONNAIRE_COMPLETED,
      HealthCheckSteps.LAB_ORDERS_PLACED
    ],
    [HealthCheckSteps.LAB_ORDERS_PLACED, HealthCheckSteps.LAB_RESULTS_RECEIVED],
    [
      HealthCheckSteps.LAB_RESULTS_RECEIVED,
      HealthCheckSteps.RISK_SCORES_CALCULATED
    ]
  ])(
    'should return true if the step %s is before the step %s',
    (currentStep: HealthCheckSteps, otherStep: HealthCheckSteps) => {
      expect(isStepBefore(currentStep, otherStep)).toBe(true);
    }
  );

  it.each([
    [HealthCheckSteps.QUESTIONNAIRE_COMPLETED, HealthCheckSteps.INIT],
    [
      HealthCheckSteps.LAB_ORDERS_PLACED,
      HealthCheckSteps.QUESTIONNAIRE_COMPLETED
    ],
    [HealthCheckSteps.LAB_RESULTS_RECEIVED, HealthCheckSteps.LAB_ORDERS_PLACED],
    [
      HealthCheckSteps.RISK_SCORES_CALCULATED,
      HealthCheckSteps.LAB_RESULTS_RECEIVED
    ]
  ])(
    'should return false if the step %s is after the step %s',
    (currentStep: HealthCheckSteps, otherStep: HealthCheckSteps) => {
      expect(isStepBefore(currentStep, otherStep)).toBe(false);
    }
  );

  it.each([
    [HealthCheckSteps.INIT, HealthCheckSteps.INIT],
    [
      HealthCheckSteps.QUESTIONNAIRE_COMPLETED,
      HealthCheckSteps.QUESTIONNAIRE_COMPLETED
    ],
    [HealthCheckSteps.LAB_ORDERS_PLACED, HealthCheckSteps.LAB_ORDERS_PLACED],
    [
      HealthCheckSteps.LAB_RESULTS_RECEIVED,
      HealthCheckSteps.LAB_RESULTS_RECEIVED
    ],
    [
      HealthCheckSteps.RISK_SCORES_CALCULATED,
      HealthCheckSteps.RISK_SCORES_CALCULATED
    ]
  ])(
    'should return false if the steps are the same: %s and %s',
    (currentStep: HealthCheckSteps, otherStep: HealthCheckSteps) => {
      expect(isStepBefore(currentStep, otherStep)).toBe(false);
    }
  );
});
