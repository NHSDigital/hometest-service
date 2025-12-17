import {
  HealthCheckSteps,
  isStepAfter,
  isStepBefore
} from '@dnhc-health-checks/shared';

describe('HealthCheckSteps utility functions', () => {
  test('isStepBefore should return true if step is before otherStep', () => {
    expect(
      isStepBefore(
        HealthCheckSteps.INIT,
        HealthCheckSteps.QUESTIONNAIRE_COMPLETED
      )
    ).toBe(true);
    expect(
      isStepBefore(
        HealthCheckSteps.LAB_ORDERS_PLACED,
        HealthCheckSteps.RISK_SCORES_CALCULATED
      )
    ).toBe(true);
  });

  test('isStepBefore should return false if step is not before otherStep', () => {
    expect(
      isStepBefore(
        HealthCheckSteps.QUESTIONNAIRE_COMPLETED,
        HealthCheckSteps.INIT
      )
    ).toBe(false);
    expect(
      isStepBefore(
        HealthCheckSteps.RISK_SCORES_CALCULATED,
        HealthCheckSteps.LAB_RESULTS_RECEIVED
      )
    ).toBe(false);
    expect(isStepBefore(HealthCheckSteps.INIT, HealthCheckSteps.INIT)).toBe(
      false
    );
  });

  test('isStepAfter should return true if step is after otherStep', () => {
    expect(
      isStepAfter(
        HealthCheckSteps.QUESTIONNAIRE_COMPLETED,
        HealthCheckSteps.INIT
      )
    ).toBe(true);
    expect(
      isStepAfter(
        HealthCheckSteps.RISK_SCORES_CALCULATED,
        HealthCheckSteps.LAB_ORDERS_PLACED
      )
    ).toBe(true);
  });

  test('isStepAfter should return false if step is not after otherStep', () => {
    expect(
      isStepAfter(
        HealthCheckSteps.INIT,
        HealthCheckSteps.QUESTIONNAIRE_COMPLETED
      )
    ).toBe(false);
    expect(
      isStepAfter(
        HealthCheckSteps.LAB_RESULTS_RECEIVED,
        HealthCheckSteps.RISK_SCORES_CALCULATED
      )
    ).toBe(false);
    expect(isStepAfter(HealthCheckSteps.INIT, HealthCheckSteps.INIT)).toBe(
      false
    );
  });
});
