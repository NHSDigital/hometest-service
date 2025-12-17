import type {
  IHealthCheck,
  IHealthCheckAnswers,
  IQuestionnaireScores
} from '@dnhc-health-checks/shared';

export const healthCheckPropertiesExcludedFromReporting: Array<
  keyof IHealthCheck
> = [
  'nhsNumber',
  'expiredAt',
  'resultTypes',
  'expiryStatus',
  'bloodTestExpiryWritebackStatus'
];

export const questionnaireExcludedFromReporting: Array<
  keyof IHealthCheckAnswers
> = [
  'postcode',
  'alcoholConcernedRelative',
  'alcoholFailedObligations',
  'alcoholMemoryLoss',
  'alcoholGuilt',
  'alcoholMorningDrink',
  'alcoholMultipleDrinksOneOccasion',
  'alcoholPersonInjured',
  'alcoholCannotStop',
  'cycleHours',
  'gardeningHours',
  'houseworkHours',
  'walkHours',
  'walkPace',
  'workActivity',
  'height',
  'weight',
  'waistMeasurement',
  'lowBloodPressureValuesConfirmed',
  'highBloodPressureValuesConfirmed',
  'hasStrongLowBloodPressureSymptoms',
  'hasHealthSymptoms',
  'lupus',
  'impotence',
  'migraines',
  'rheumatoidArthritis',
  'severeMentalIllness',
  'atypicalAntipsychoticMedication',
  'steroidTablets'
];

export const questionnaireScoresExcludedFromReporting: Array<
  keyof IQuestionnaireScores
> = ['inProgressAuditScore'];
