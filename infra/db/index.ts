import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { Stack } from './stack';
import { NhcDbStack } from './stacks/nhc-db-stack';
import { NhcDataLoadStack } from './stacks/nhc-data-load-stack';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { initializeEnvVariables } from './settings';
import { NhsAlarmFactory } from '../common/nhc-alarm-factory';
import { NhcTopic } from '../common/lib/enums';

const app = new App();
const awsAccount: string = app.node.tryGetContext('awsAccount');
const environment: string = app.node.tryGetContext('environment');

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

dotenv.config({ path: path.join(__dirname, `./env/defaults.env`) });

if (awsAccount === 'poc') {
  dotenv.config({
    path: path.join(__dirname, `./env/${awsAccount}/defaults.env`),
    override: true
  });
}

dotenv.config({
  path: path.join(__dirname, `./env/${awsAccount}/${environment}.env`),
  override: true
});

const envVariables = initializeEnvVariables(environment);
process.env.HEALTH_CHECK_ENVIRONMENT = environment;
console.log('Initialised environment variables', envVariables);

const alarmFactory = new NhsAlarmFactory({
  alarmsEnabled: envVariables.alarmsEnabled,
  nhcTopic: NhcTopic.STANDARD
});

const nhcDbStack = new NhcDbStack(app, Stack.DB, { envVariables });

new NhcDataLoadStack(app, Stack.DATA_LOAD, {
  alarmFactory,
  envVariables,
  dbStack: nhcDbStack
});
app.synth();
