// The shared stack relates to components that are to only be deployed once per AWS Account (Not once per env)

import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { initializeEnvVariables } from './settings';
import { NhcMonitoringNotificationsStack } from './stacks/nhc-monitoring-notifications-stack';
import { NhcMonitoringNotificationsDDOSAlertsStack } from './stacks/nhc-monitoring-notifications-ddos-alerts-stack';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { NhcEmailVerificationStack } from './stacks/nhc-email-verification-stack';
import { EnvType } from '../common/lib/enums';
import { NhcSharedResourcesStack } from './stacks/nhc-shared-resources-stack';

const app = new App();
const awsAccount: string = app.node.tryGetContext('awsAccount');

if (awsAccount === undefined) {
  throw new Error(
    'Specify awsAccount with the --context e.g. "--context awsAccount=<account>". Values can be poc, test, int or prod'
  );
}

dotenv.config({ path: path.join(__dirname, `./env/defaults.env`) });
dotenv.config({
  path: path.join(__dirname, `./env/${awsAccount}.env`),
  override: true
});
const envVariables = initializeEnvVariables();
console.log(envVariables);

// This stack creates Slack Channel configuration and alerts topic. Only one configuration for given channel per account is allowed.
new NhcMonitoringNotificationsStack(app, 'nhc-monitoring-notifications-stack', {
  envVariables
});

// This stack creates Slack Channel configuration and alerts topic. Only one configuration for given channel per account is allowed.
new NhcMonitoringNotificationsDDOSAlertsStack(
  app,
  'nhc-monitoring-notifications-ddos-alerts-stack',
  {
    envVariables
  }
);

if (envVariables.envType === EnvType.NONPROD) {
  // This stack is for test notification purposes.
  new NhcEmailVerificationStack(app, 'nhc-email-verification-stack', {
    envVariables
  });
}

new NhcSharedResourcesStack(app, 'nhc-shared-resources-stack', {
  envVariables
});

app.synth();
