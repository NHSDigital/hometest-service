/**
 * Define your insights query and the log groups it should run on. 
 * You can either provide individual names of log groups in logGroups array, 
 * or provide stackNames, which will apply the query to all lambda log groups defined in that stack.
 * 
 * You can provide both, which will add the query to both custom log groups and stack log groups.
 */
module.exports = (stage) => ({
  query:
    `fields @timestamp, lambda, className, msg
  | parse @message '"correlationId":[*]' as corrIds
  | filter (correlationIds.correlationId = 'PUT THE CORRELATION ID HERE' or corrIds like 'PUT THE CORRELATION ID HERE')
  | sort @timestamp asc`,
  logGroups: [],
  stackNames: [`${stage}-nhc-result-stack`],
  excludeEnvs: []
});
