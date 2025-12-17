import type { IHealthCheckAnswers } from '@dnhc-health-checks/shared';

export const aboutYouSectionItem: Array<keyof IHealthCheckAnswers> = [
  'postcode',
  'hasFamilyHeartAttackHistory',
  'hasFamilyDiabetesHistory',
  'sex',
  'smoking',
  'lupus',
  'severeMentalIllness',
  'atypicalAntipsychoticMedication',
  'migraines',
  'impotence',
  'steroidTablets',
  'rheumatoidArthritis',
  'alcoholCannotStop',
  'ethnicBackground',
  'detailedEthnicGroup'
];

export const leicesterDiabetesRiskScoreItem: Array<keyof IHealthCheckAnswers> =
  [
    'hasFamilyDiabetesHistory',
    'sex',
    'ethnicBackground',
    'height',
    'weight',
    'waistMeasurement'
  ];

export const bloodPressureSectionItem: Array<keyof IHealthCheckAnswers> = [
  'bloodPressureLocation',
  'bloodPressureSystolic',
  'bloodPressureDiastolic'
];

export const checkEligibilitySectionItem: Array<keyof IHealthCheckAnswers> = [
  'canCompleteHealthCheckOnline',
  'hasCompletedHealthCheckInLast5Years',
  'hasPreExistingCondition'
];

export const bodyMeasurementsSectionItem: Array<keyof IHealthCheckAnswers> = [
  'height',
  'weight',
  'waistMeasurement'
];

export const physicalActivitySectionItem: Array<keyof IHealthCheckAnswers> = [
  'cycleHours',
  'exerciseHours',
  'gardeningHours',
  'houseworkHours',
  'walkHours',
  'walkPace',
  'workActivity'
];
