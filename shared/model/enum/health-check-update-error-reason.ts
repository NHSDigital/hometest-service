export enum HealthCheckUpdateErrorReason {
  HealthCheckNotFound = 'HealthCheckNotFound',
  BadRequest = 'BadRequest',
  HealthCheckExpired = 'HealthCheckExpired',
  HealthCheckStepError = 'HealthCheckStepError',
  HealthCheckSubmitted = 'HealthCheckSubmitted',
  HealthCheckNotCompleted = 'HealthCheckNotCompleted',
  HealthCheckInvalidSchema = 'HealthCheckInvalidSchema',
  UnknownError = 'UnknownError'
}
