// Copy of ui/src/lib/models/audit-event-type-details.ts
// Additional Data to log https://nhsd-confluence.digital.nhs.uk/display/DHC/Audit+Event+Logging
export enum PatientResultsDetailedOpenedPage {
  Alcohol = 'AlcoholResults',
  BloodPressure = 'BloodPressureResults',
  BMI = 'BMIResults',
  Cholesterol = 'CholesterolResults',
  Diabetes = 'DiabetesResults',
  Smoking = 'SmokingResults',
  Dementia = 'DementiaResults',
  PhysicalActivity = 'PhysicalActivityResults'
}

export enum HbA1cStatus {
  SUCCESSFUL = 'successful',
  FAILURE = 'failure',
  NONE = 'none'
}
export enum AuditEventExpiryType {
  AUTO_EXPIRED = 'AUTO_EXPIRED'
}
