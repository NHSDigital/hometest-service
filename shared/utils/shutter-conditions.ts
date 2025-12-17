import { type IHealthCheckAnswers } from '../model/health-check-answers';

export type ShutterConditionKey =
  | 'lowBloodPressureSymptoms'
  | 'highBloodPressure'
  | 'diabetes';

export interface ShutterCondition {
  check: (questionnaire: IHealthCheckAnswers) => boolean;
}

export const shouldShowDiabetesShutterPage = (
  healthCheckAnswers: Partial<IHealthCheckAnswers>
): boolean => {
  return healthCheckAnswers.hasHealthSymptoms === true;
};

export const shouldShowLowBloodPressureShutterPage = (
  healthCheckAnswers: Partial<IHealthCheckAnswers>
): boolean => {
  return healthCheckAnswers.hasStrongLowBloodPressureSymptoms === true;
};

export const shouldShowHighBloodPressureShutterPage = (
  healthCheckAnswers: Partial<IHealthCheckAnswers>
): boolean => {
  return healthCheckAnswers.highBloodPressureValuesConfirmed === true;
};

export const shutterConditions: Array<{
  key: ShutterConditionKey;
  check: (answers: Partial<IHealthCheckAnswers>) => boolean;
}> = [
  {
    key: 'lowBloodPressureSymptoms',
    check: shouldShowLowBloodPressureShutterPage
  },
  { key: 'highBloodPressure', check: shouldShowHighBloodPressureShutterPage },
  { key: 'diabetes', check: shouldShowDiabetesShutterPage }
];
