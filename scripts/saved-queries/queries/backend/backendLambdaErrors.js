/**
 * Define your insights query and the log groups it should run on. 
 * You can either provide individual names of log groups in logGroups array, 
 * or provide stackNames, which will apply the query to all lambda log groups defined in that stack.
 * 
 * You can provide both, which will add the query to both custom log groups and stack log groups.
 */
module.exports = (stage) => ({
  query:
    `fields @timestamp, logLevel, lambda, className, msg
  | filter logLevel = 'ERROR'
  | sort @timestamp desc`,
  logGroups: [],
  stackNames: [`${stage}-nhc-backend-stack`]
});
