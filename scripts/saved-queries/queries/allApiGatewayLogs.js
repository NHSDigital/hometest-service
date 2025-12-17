const { getLogGroupNames, logGroupNames } = require('../logGroups')

/**
 * Define your insights query and the log groups it should run on. 
 * You can either provide individual names of log groups in logGroups array, 
 * or provide stackNames, which will apply the query to all lambda log groups defined in that stack.
 * 
 * You can provide both, which will add the query to both custom log groups and stack log groups.
 */
module.exports = (stage) => ({
  query:
    `fields @timestamp, @responseCode, @message
  | parse @message /\\" (?<@responseCode>([0-9]){3}) /
  | sort @timestamp asc`,
  logGroups: getLogGroupNames(stage, [
    logGroupNames.nhcHealthCheckApiGatewayLogs,
    logGroupNames.nhcLabOrderApiGatewayLogs,
    logGroupNames.nhcMocksApiGatewayLogs,
    logGroupNames.nhcResultsApiGatewayLogs
  ]),
  stackNames: [],
  // sample of env exlucion configuration, as mocks might not be available there
  excludeEnvs: ['prod', 'demo']
});
