export enum HealthCheckSteps {
  AUTO_EXPIRED = 'AUTO_EXPIRED',
  AUTO_EXPIRED_BLOOD_NOT_ORDERED = 'AUTO_EXPIRED_BLOOD_NOT_ORDERED',
  AUTO_EXPIRED_BLOOD_ORDERED = 'AUTO_EXPIRED_BLOOD_ORDERED',
  AUTO_EXPIRED_BLOOD_RECEIVED = 'AUTO_EXPIRED_BLOOD_RECEIVED',
  AUTO_EXPIRED_BLOOD_FINAL = 'AUTO_EXPIRED_BLOOD_FINAL',
  AUTO_EXPIRED_NO_BLOOD_FINAL = 'AUTO_EXPIRED_NO_BLOOD_FINAL',
  INIT = 'INIT',
  QUESTIONNAIRE_COMPLETED = 'QUESTIONNAIRE_COMPLETED',
  LAB_ORDERS_SCHEDULED = 'LAB_ORDERS_SCHEDULED',
  LAB_ORDERS_PLACED = 'LAB_ORDERS_PLACED',
  LAB_RESULTS_RECEIVED = 'LAB_RESULTS_RECEIVED',
  RISK_SCORES_CALCULATED = 'RISK_SCORES_CALCULATED',
  GP_UPDATE_FAILED = 'GP_UPDATE_FAILED',
  GP_UPDATE_SUCCESS = 'GP_UPDATE_SUCCESS'
}

export const HealthCheckStepOrder = {
  [HealthCheckSteps.AUTO_EXPIRED]: -1,
  [HealthCheckSteps.AUTO_EXPIRED_BLOOD_NOT_ORDERED]: -1,
  [HealthCheckSteps.AUTO_EXPIRED_BLOOD_ORDERED]: -1,
  [HealthCheckSteps.AUTO_EXPIRED_BLOOD_RECEIVED]: -1,
  [HealthCheckSteps.AUTO_EXPIRED_BLOOD_FINAL]: -1,
  [HealthCheckSteps.AUTO_EXPIRED_NO_BLOOD_FINAL]: -1,
  [HealthCheckSteps.INIT]: 1,
  [HealthCheckSteps.QUESTIONNAIRE_COMPLETED]: 2,
  [HealthCheckSteps.LAB_ORDERS_SCHEDULED]: 3,
  [HealthCheckSteps.LAB_ORDERS_PLACED]: 4,
  [HealthCheckSteps.LAB_RESULTS_RECEIVED]: 5,
  [HealthCheckSteps.RISK_SCORES_CALCULATED]: 6,
  [HealthCheckSteps.GP_UPDATE_FAILED]: 7,
  [HealthCheckSteps.GP_UPDATE_SUCCESS]: 8
};

export function isStepBefore(
  step: HealthCheckSteps,
  otherStep: HealthCheckSteps
): boolean {
  return HealthCheckStepOrder[step] < HealthCheckStepOrder[otherStep];
}

export function isStepAfter(
  step: HealthCheckSteps,
  otherStep: HealthCheckSteps
): boolean {
  return HealthCheckStepOrder[step] > HealthCheckStepOrder[otherStep];
}

export function isStepEqualOrAfter(
  step: HealthCheckSteps,
  otherStep: HealthCheckSteps
) {
  return HealthCheckStepOrder[step] >= HealthCheckStepOrder[otherStep];
}
