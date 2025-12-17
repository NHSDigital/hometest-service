const { getLogGroupName, logGroupNames } = require('../../logGroups')

module.exports = (stage) => ({
  query:
    `fields @timestamp, logLevel, lambda, className, data.messageReference, data.messageType, data.healthCheckId
    | filter msg = 'Notify failed to deliver message'
    | sort @timestamp desc`,
  logGroups: [getLogGroupName(stage, logGroupNames.nhcNotifyCallbackLambdaLogs)],
  stackNames: [],
  excludeEnvs: []
});
