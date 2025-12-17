import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { Stack } from './stack';
import { NhcMocksStack } from './stacks/nhc-mocks-stack';
import { NhcDevDbStack } from './stacks/nhc-dev-db-stack';
import { initializeEnvVariables } from './settings';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { NhsAlarmFactory } from '../common/nhc-alarm-factory';
import { NhcTopic } from '../common/lib/enums';

const app = new App();
const awsAccount: string = app.node.tryGetContext('awsAccount');

const environment: string = app.node.tryGetContext('environment');

if (awsAccount === undefined) {
  throw new Error(
    'Specify awsAccount with the --context e.g. "--context awsAccount=<account>". Values can be poc, test or int'
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
    path: path.join(__dirname, `./env/poc/defaults.env`),
    override: true
  });
}

dotenv.config({
  path: path.join(__dirname, `./env/${awsAccount}/${environment}.env`),
  override: true
});

const envVariables = initializeEnvVariables(environment);

process.env.HEALTH_CHECK_ENVIRONMENT = environment;
console.log(envVariables);

const alarmFactory = new NhsAlarmFactory({
  alarmsEnabled: envVariables.alarmsEnabled,
  nhcTopic: NhcTopic.STANDARD
});

new NhcMocksStack(app, Stack.MOCK, { envVariables, alarmFactory });

new NhcDevDbStack(app, Stack.DEV_DB, { envVariables });
app.synth();
