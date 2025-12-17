module.exports = (stage) => ({
  query:
    `fields @timestamp, logLevel, lambda, module, msg, data.eventType as eventType
    | filter metadata.healthCheckId = 'PUT HEALTH CHECK ID HERE' or metadata.patientId = 'PUT PATIENT ID HERE'
    | filter logLevel != 'DEBUG'
    | sort @timestamp desc`,
  logGroups: [],
  stackNames: [`${stage}-nhc-backend-stack`, `${stage}-nhc-order-stack`, `${stage}-nhc-result-stack`, `${stage}-nhc-gp-partial-update-stack`, `${stage}-nhc-pdm-integration-stack`],
  excludeEnvs: []
});