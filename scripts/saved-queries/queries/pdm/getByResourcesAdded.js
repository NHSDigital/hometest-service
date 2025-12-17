module.exports = (stage) => ({
  query:
    `fields @timestamp, lambda, className, msg
  | filter msg like /resources added/
  | sort @timestamp desc`,
  logGroups: [],
  stackNames: [`${stage}-nhc-pdm-integration-stack`],
  excludeEnvs: []
});
