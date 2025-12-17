import type {
  ParentSiblingHeartAttack,
  ParentSiblingChildDiabetes,
  Sex,
  EthnicBackground,
  DoYouDrinkAlcohol,
  AlcoholHowOften,
  AlcoholDailyUnits,
  AlcoholPersonInjuredAndConcernedRelative,
  AlcoholEventsFrequency,
  ExerciseHours,
  WalkingPace,
  WorkActivity,
  Smoking,
  HeightDisplayPreference,
  WeightDisplayPreference,
  WaistMeasurementDisplayPreference,
  BloodPressureLocation
} from './enum/health-check-answers';

export interface IHealthCheckAnswers
  extends IAboutYou,
    IBodyMeasurements,
    IBloodPressure,
    IPhysicalActivity,
    IAlcoholConsumption,
    IEligibility {}

export interface IAboutYou {
  postcode?: string | null;
  hasFamilyHeartAttackHistory?: ParentSiblingHeartAttack | null;
  hasFamilyDiabetesHistory?: ParentSiblingChildDiabetes | null;
  sex?: Sex | null;
  ethnicBackground?: EthnicBackground | null;
  detailedEthnicGroup?: string | null;
  smoking?: Smoking | null;
  lupus?: boolean | null;
  severeMentalIllness?: boolean | null;
  atypicalAntipsychoticMedication?: boolean | null;
  migraines?: boolean | null;
  impotence?: boolean | null;
  steroidTablets?: boolean | null;
  rheumatoidArthritis?: boolean | null;
  isAboutYouSectionSubmitted?: boolean | null;
}

export interface IBodyMeasurements {
  weight?: number | null;
  height?: number | null;
  waistMeasurement?: number | null;
  heightDisplayPreference?: HeightDisplayPreference | null;
  weightDisplayPreference?: WeightDisplayPreference | null;
  waistMeasurementDisplayPreference?: WaistMeasurementDisplayPreference | null;
  /** @deprecated This property is no longer used, but we keep it to be able to show the diabetes shutter page */
  hasHealthSymptoms?: boolean | null;
  isBodyMeasurementsSectionSubmitted?: boolean | null;
}

export interface IBloodPressure {
  bloodPressureDiastolic?: number | null;
  bloodPressureSystolic?: number | null;
  bloodPressureLocation?: BloodPressureLocation | null;
  lowBloodPressureValuesConfirmed?: boolean | null;
  highBloodPressureValuesConfirmed?: boolean | null;
  hasStrongLowBloodPressureSymptoms?: boolean | null;
  isBloodPressureSectionSubmitted?: boolean | null;
}

export interface IPhysicalActivity {
  cycleHours?: ExerciseHours | null;
  exerciseHours?: ExerciseHours | null;
  gardeningHours?: ExerciseHours | null;
  houseworkHours?: ExerciseHours | null;
  walkHours?: ExerciseHours | null;
  walkPace?: WalkingPace | null;
  workActivity?: WorkActivity | null;
  isPhysicalActivitySectionSubmitted?: boolean | null;
}

export interface IAlcoholConsumption {
  drinkAlcohol?: DoYouDrinkAlcohol | null;
  alcoholHowOften?: AlcoholHowOften | null;
  alcoholDailyUnits?: AlcoholDailyUnits | null;
  alcoholConcernedRelative?: AlcoholPersonInjuredAndConcernedRelative | null;
  alcoholFailedObligations?: AlcoholEventsFrequency | null;
  alcoholGuilt?: AlcoholEventsFrequency | null;
  alcoholMemoryLoss?: AlcoholEventsFrequency | null;
  alcoholMorningDrink?: AlcoholEventsFrequency | null;
  alcoholMultipleDrinksOneOccasion?: AlcoholEventsFrequency | null;
  alcoholPersonInjured?: AlcoholPersonInjuredAndConcernedRelative | null;
  alcoholCannotStop?: AlcoholEventsFrequency | null;
  isAlcoholSectionSubmitted?: boolean | null;
}

export interface IEligibility {
  hasPreExistingCondition?: boolean | null;
  hasCompletedHealthCheckInLast5Years?: boolean | null;
  canCompleteHealthCheckOnline?: boolean | null;
  hasReceivedAnInvitation?: boolean | null;
}
