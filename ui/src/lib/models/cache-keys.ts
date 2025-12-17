export enum CacheStaleTimes {
  HealthCheck = 50000, // 50 seconds
  PatientInfo = 3600000 // 1 hour
}

export enum CacheKeys {
  HealthCheck = 'healthCheck',
  PatientInfo = 'patientInfo'
}
