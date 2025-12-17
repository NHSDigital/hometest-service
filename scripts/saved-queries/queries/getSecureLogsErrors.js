module.exports = (stage) => ({
  query:
    `fields @timestamp, msg, logLevel, lambda, context.resourcePath
    | filter security = 1
    | filter logLevel = 'ERROR'
    | sort @timestamp desc`,
  logGroups: [],
  stackNames: [`${stage}-nhc-backend-stack`],
  excludeEnvs: []
});

