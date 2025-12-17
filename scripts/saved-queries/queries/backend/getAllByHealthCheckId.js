module.exports = (stage) => ({
  query:
    `fields @timestamp, msg, logLevel, lambda, context.resourcePath
    | filter metadata.healthCheckId = 'PUT YOUR HEALTH CHECK ID HERE'
    | sort @timestamp desc`,
  logGroups: [],
  stackNames: [`${stage}-nhc-backend-stack`],
  excludeEnvs: []
});
