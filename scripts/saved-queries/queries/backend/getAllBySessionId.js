module.exports = (stage) => ({
  query:
    `fields @timestamp, msg, logLevel, lambda, context.resourcePath
    | filter metadata.sessionId = 'PUT YOUR SESSION ID HERE'
    | sort @timestamp desc`,
  logGroups: [],
  stackNames: [`${stage}-nhc-backend-stack`],
  excludeEnvs: []
});
