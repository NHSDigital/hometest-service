import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { Stack } from './stack';
import { NhcResultsStack } from './stacks/nhc-result-stack';
import { NhcDbImportStack } from './stacks/nhc-db-import-stack';
import { NhcUiStack } from './stacks/nhc-ui-stack';
import { NhcUiLoggingStack } from './stacks/nhc-ui-logging-stack';
import { NhcDDOSAlarmStack } from './stacks/nhc-ddos-alarm-stack';
import { NhcBackendStack } from './stacks/nhc-backend-stack';
import { NhcEventsStack } from './stacks/nhc-event-stack';
import { NhcOrderStack } from './stacks/nhc-order-stack';
import { initializeEnvVariables } from './settings';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { NhcMonitoringStack } from './stacks/nhc-monitoring-stack';
import { NhcReportingStack } from './stacks/reporting/nhc-reporting-stack';
import { NhcExpiredDataStack } from './stacks/nhc-expired-data-stack';
import { NhcGpPartialUpdateStack } from './stacks/nhc-gp-partial-update-stack';
import { NhcPdmIntegrationStack } from './stacks/nhc-pdm-integration-stack';
import { NhcMonitoringDashboardStack } from './stacks/nhc-monitoring-dashboard-stack';
import { NhsAlarmFactory } from '../common/nhc-alarm-factory';
import { NhcTopic } from '../common/lib/enums';
import { NhcRemindersStack } from './stacks/nhc-reminders-stack';
import { NhcMnsStack } from './stacks/nhc-mns-stack';

const app = new App();
const awsAccount: string = app.node.tryGetContext('awsAccount');

const environment: string = app.node.tryGetContext('environment');
const local = app.node.tryGetContext('local');

if (awsAccount === undefined) {
  throw new Error(
    'Specify awsAccount with the --context e.g. "--context awsAccount=<account>". Values can be poc, test, int or prod'
  );
}

if (environment === undefined) {
  throw new Error(
    'Specify environment with the --context e.g. "--context environment=<env>".'
  );
}
process.env.HEALTH_CHECK_ENVIRONMENT = environment;

dotenv.config({ path: path.join(__dirname, `./env/defaults.env`) });

if (awsAccount === 'poc') {
  dotenv.config({
    path: path.join(__dirname, `./env/poc/defaults.env`),
    override: true
  });
}

dotenv.config({
  path: path.join(__dirname, `./env/${awsAccount}/${environment}.env`),
  override: true
});

if (local === 'true') {
  dotenv.config({
    path: path.join(__dirname, `./env/local-overrides.env`),
    override: true
  });
}

const envVariables = initializeEnvVariables(environment);
console.log(envVariables);

const alarmFactory = new NhsAlarmFactory({
  alarmsEnabled: envVariables.alarmsEnabled,
  nhcTopic: NhcTopic.STANDARD
});

const securityAlarmFactory = new NhsAlarmFactory({
  alarmsEnabled: envVariables.alarmsEnabled,
  nhcTopic: NhcTopic.SECURITY
});

const nhcDbImportStack = new NhcDbImportStack(app, Stack.DB_IMPORT, {
  envVariables
});

const monitoringStack = new NhcMonitoringStack(app, Stack.MONITORING, {
  deadLetterMessagesDbTable: nhcDbImportStack.deadLetterMessagesDbTable,
  envVariables,
  alarmFactory
});

const nhsEventsStack = new NhcEventsStack(app, Stack.EVENTS, {
  auditEventTable: nhcDbImportStack.auditEventDbTable,
  patientTable: nhcDbImportStack.patientDbTable,
  sqsRedrive: monitoringStack.sqsRedrive,
  envVariables,
  alarmFactory
});

const nhsOrderStack = new NhcOrderStack(app, Stack.ORDER, {
  healthCheckTable: nhcDbImportStack.healthCheckDbTable,
  orderTable: nhcDbImportStack.orderDbTable,
  patientTable: nhcDbImportStack.patientDbTable,
  auditEventsQueue: nhsEventsStack.auditEventsQueue.mainQueue,
  sqsRedrive: monitoringStack.sqsRedrive,
  envVariables,
  alarmFactory
});

new NhcReportingStack(app, Stack.REPORTING, {
  auditEventTable: nhcDbImportStack.auditEventDbTable,
  healthCheckTable: nhcDbImportStack.healthCheckDbTable,
  odsCodeTable: nhcDbImportStack.gpOdsCodeDbTable,
  envVariables,
  alarmFactory
});

const mnsStack = new NhcMnsStack(app, Stack.MNS, {
  envVariables,
  alarmFactory,
  mnsMessagesLogTable: nhcDbImportStack.mnsMessagesLogDbTable,
  auditEventsQueue: nhsEventsStack.auditEventsQueue.mainQueue
});

const pdmStack = new NhcPdmIntegrationStack(app, Stack.PDM_INTEGRATION, {
  healthCheckTable: nhcDbImportStack.healthCheckDbTable,
  patientTable: nhcDbImportStack.patientDbTable,
  labResultTable: nhcDbImportStack.labResultDbTable,
  snomedCodesTable: nhcDbImportStack.snomedDbTable,
  mnsOutboundQueue: mnsStack.mnsOutboundQueue.mainQueue,
  sqsRedrive: monitoringStack.sqsRedrive,
  envVariables,
  alarmFactory
});

const resultStack = new NhcResultsStack(app, Stack.RESULTS, {
  healthCheckTable: nhcDbImportStack.healthCheckDbTable,
  orderTable: nhcDbImportStack.orderDbTable,
  labResultTable: nhcDbImportStack.labResultDbTable,
  patientTable: nhcDbImportStack.patientDbTable,
  snomedTable: nhcDbImportStack.snomedDbTable,
  odsCodeTable: nhcDbImportStack.gpOdsCodeDbTable,
  communicationLogTable: nhcDbImportStack.communicationLogDbTable,
  qriskFailuresMetric: monitoringStack.qriskFailuresMetric.metricName,
  auditEventsQueue: nhsEventsStack.auditEventsQueue.mainQueue,
  pdmQueue: pdmStack.pdmQueue.mainQueue,
  envVariables,
  sqsRedrive: monitoringStack.sqsRedrive,
  alarmFactory
});

new NhcRemindersStack(app, Stack.REMINDERS, {
  healthCheckTable: nhcDbImportStack.healthCheckDbTable,
  patientTable: nhcDbImportStack.patientDbTable,
  communicationQueue: resultStack.communicationQueue.mainQueue,
  alarmFactory,
  envVariables
});

const backendStack = new NhcBackendStack(app, Stack.BACKEND, {
  patientTable: nhcDbImportStack.patientDbTable,
  healthCheckTable: nhcDbImportStack.healthCheckDbTable,
  gpUpdateSchedulerTable: nhcDbImportStack.gpUpdateSchedulerDbTable,
  orderTable: nhcDbImportStack.orderDbTable,
  gpOdsCodeTable: nhcDbImportStack.gpOdsCodeDbTable,
  sessionTable: nhcDbImportStack.sessionDbTable,
  townsendScoreTable: nhcDbImportStack.townsendScoreDbTable,
  postcodeLsoaTable: nhcDbImportStack.postcodeLsoaDbTable,
  lsoaImdTable: nhcDbImportStack.lsoaImdDbTable,
  communicationLogTable: nhcDbImportStack.communicationLogDbTable,
  auditEventsQueue: nhsEventsStack.auditEventsQueue.mainQueue,
  labOrderQueue: nhsOrderStack.labOrderQueue.mainQueue,
  appMonitorIdentityPool: monitoringStack.appMonitorIdentityPool,
  alarmFactory,
  envVariables
});

new NhcMonitoringDashboardStack(app, Stack.MONITORING_DASHBOARD, {
  eventAuditLambdaLogGroup: backendStack.eventAuditLambdaLogGroup,
  healthCheckInitLambdaLogGroup: backendStack.healthCheckInitLambdaLogGroup,
  labOrderPlacementLambdaLogGroup:
    nhsOrderStack.labOrderPlacementLambdaLogGroup,
  updatePatientRecordLambdaLogGroup:
    resultStack.updatePatientRecordLambdaLogGroup,
  loginLambdaLogGroup: backendStack.loginCallbackLambdaLogGroup,
  redriveDlqMessagesLambdaLogGroup:
    monitoringStack.redriveDlqMessagesLambda.logGroup,
  healthCheckApiLogGroup: backendStack.apiLogGroup,
  envVariables
});

const nhcUiStack = new NhcUiStack(app, Stack.UI, { envVariables });

new NhcUiLoggingStack(app, Stack.UI_LOGGING, {
  envVariables: envVariables,
  cloudfrontArn: nhcUiStack.cloudfrontArn
});

new NhcDDOSAlarmStack(app, Stack.ALARM, {
  envVariables,
  cloudfrontArn: nhcUiStack.cloudfrontArn,
  securityAlarmFactory
});

new NhcExpiredDataStack(app, Stack.EXPIRED_DATA, {
  healthCheckTable: nhcDbImportStack.healthCheckDbTable,
  orderTable: nhcDbImportStack.orderDbTable,
  labResultTable: nhcDbImportStack.labResultDbTable,
  patientTable: nhcDbImportStack.patientDbTable,
  gpUpdateSchedulerTable: nhcDbImportStack.gpUpdateSchedulerDbTable,
  auditEventsQueue: nhsEventsStack.auditEventsQueue.mainQueue,
  envVariables,
  alarmFactory,
  communicationQueue: resultStack.communicationQueue.mainQueue
});

new NhcGpPartialUpdateStack(app, Stack.GP_PARTIAL_UPDATE, {
  gpUpdateSchedulerDbTable: nhcDbImportStack.gpUpdateSchedulerDbTable,
  healthCheckDbTable: nhcDbImportStack.healthCheckDbTable,
  patientDbTable: nhcDbImportStack.patientDbTable,
  snomedDbTable: nhcDbImportStack.snomedDbTable,
  labResultDbTable: nhcDbImportStack.labResultDbTable,
  odsCodeDbTable: nhcDbImportStack.gpOdsCodeDbTable,
  auditEventsQueue: nhsEventsStack.auditEventsQueue.mainQueue,
  pdmQueue: pdmStack.pdmQueue.mainQueue,
  gpNotificationQueue: resultStack.gpNotificationQueue.mainQueue,
  emisPayloadBucket: resultStack.emisPayloadBucket,
  getActiveUserLambda: resultStack.getActiveUserLambda,
  sqsRedrive: monitoringStack.sqsRedrive,
  envVariables,
  alarmFactory
});

app.synth();
