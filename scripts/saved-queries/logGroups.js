module.exports.logGroupNames = {
  nhcHealthCheckApiGatewayLogs: "|env|NhcHealthCheckApiGatewayLogs",
  nhcLabOrderApiGatewayLogs: "|env|NhcLabOrderApiGatewayLogs",
  nhcMocksApiGatewayLogs: "|env|NhcMocksApiGatewayLogs",
  nhcResultsApiGatewayLogs: "|env|NhcResultsApiGatewayLogs",
  nhcNotifyCallbackLambdaLogs: "/aws/lambda/|env|NhcNotifyCallbacksLambdaLogGroup"
};

module.exports.getLogGroupName = (stage, logGroup) => logGroup.replace('|env|', stage);
module.exports.getLogGroupNames = (stage, logGroups) => logGroups.map((logGroup) => this.getLogGroupName(stage, logGroup));
