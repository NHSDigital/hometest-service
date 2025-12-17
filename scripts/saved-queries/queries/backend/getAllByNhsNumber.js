module.exports = (stage) => ({
  query:
    `fields @timestamp, msg, logLevel, lambda, context.resourcePath
    | filter metadata.nhsNumber = 'PUT YOUR NHS NUMBER HERE'
    | sort @timestamp desc`,
  logGroups: [],
  stackNames: [`${stage}-nhc-backend-stack`],
  excludeEnvs: []
});
