// The shared stack relates to components that are to only be deployed once per AWS Account (Not once per env)
// This mainly involves the 3 WAFs that are deployed once per account to protect the networked resource
// There is some niche logic that allows us to customise per account, per WAF, what rules and configurations are applied
// The 3 WAF types are Global (CloudFront Distributions), Regional (Public facing APIGWs), Integrator (Private/Trusted APIGWs)
// The WAF composition and guides are stored at {conflunce link}
// Reach out to Security for any issues
// https://open.spotify.com/track/5n6RDaGFSN88oRWuGtYAIN

import 'source-map-support/register';
import { App, Tags } from 'aws-cdk-lib';
import { WAFClassType } from './WAFClassType';
import { NhcRegionalWafStack } from './stacks/regional-waf-stack';
import { NhcGlobalWafStack } from './stacks/global-waf-stack';
import { NhcIntegratorWafStack } from './stacks/integrator-waf-stack';
import { initializeEnvVariables } from './settings';
import { NhcLogsWAFResourcePolicyStack } from './stacks/logs-waf-resource-policy';
import { IPListsStack } from './stacks/IP-Lists-Stack';
import { WAFResourceScope } from './stacks/common/WAF-Resource-Scope';
import { NhcNoIPIntegratorWafStack } from './stacks/no-ip-integrator-waf';
import * as dotenv from 'dotenv';
import * as path from 'path';

const app = new App();
const environment: string = app.node.tryGetContext('environment');
const envType: string = app.node.tryGetContext('envType');
const securityVersion: string = '005';

if (environment === undefined) {
  throw new Error(
    'Specify environment with the --context e.g. "--context environment=<env>".'
  );
}
if (envType === undefined) {
  throw new Error(
    'Specify envType with the --context e.g. "--context envType=<envType>".'
  );
}

dotenv.config({ path: path.join(__dirname, `./env/defaults.env`) });
dotenv.config({
  path: path.join(__dirname, `./env/${envType}.env`),
  override: true
});
process.env.HEALTH_CHECK_ENVIRONMENT = environment;
const envVariables = initializeEnvVariables(environment);

const resourcePolicyEuWest2 = new NhcLogsWAFResourcePolicyStack(
  app,
  `${WAFClassType.ResourcePolicy}-eu-west-2`,
  {
    envVariables,
    env: {
      region: 'eu-west-2'
    }
  },
  securityVersion
);

const resourcePolicyUsEast1 = new NhcLogsWAFResourcePolicyStack(
  app,
  `${WAFClassType.ResourcePolicy}-us-east-1`,
  {
    envVariables,
    env: {
      region: 'us-east-1'
    }
  },
  securityVersion
);

const ipListEUWest2 = new IPListsStack(
  app,
  'IPListEUWest2',
  {
    envVariables,
    crossRegionReferences: false,
    env: {
      region: 'eu-west-2'
    }
  },
  WAFResourceScope.Regional,
  securityVersion
);

const ipListUSEast1 = new IPListsStack(
  app,
  'IPListUSEast1',
  {
    envVariables,
    crossRegionReferences: false,
    env: {
      region: 'us-east-1'
    }
  },
  WAFResourceScope.CloudFront,
  securityVersion
);

const globalStack = new NhcGlobalWafStack(
  app,
  WAFClassType.gWAF,
  {
    envVariables,
    crossRegionReferences: true,
    env: {
      region: 'us-east-1'
    }
  },
  securityVersion
);

const regionalStack = new NhcRegionalWafStack(
  app,
  WAFClassType.rWAF + 'v2',
  {
    envVariables,
    crossRegionReferences: true,
    env: {
      region: 'eu-west-2'
    }
  },
  globalStack,
  securityVersion
);

const integratorStack = new NhcIntegratorWafStack(
  app,
  WAFClassType.iWAF,
  {
    envVariables,
    crossRegionReferences: true,
    env: {
      region: 'eu-west-2'
    }
  },
  securityVersion
);

const noIPIntegratorStack = new NhcNoIPIntegratorWafStack(
  app,
  WAFClassType.noIPiWAF,
  {
    envVariables,
    crossRegionReferences: true,
    env: {
      region: 'eu-west-2'
    }
  },
  securityVersion
);

Tags.of(regionalStack).add('StackType', 'Security');
Tags.of(integratorStack).add('StackType', 'Security');
Tags.of(noIPIntegratorStack).add('StackType', 'Security');
Tags.of(globalStack).add('StackType', 'Security');
Tags.of(resourcePolicyEuWest2).add('StackType', 'Security');
Tags.of(resourcePolicyUsEast1).add('StackType', 'Security');
Tags.of(ipListEUWest2).add('StackType', 'Security');
Tags.of(ipListUSEast1).add('StackType', 'Security');

app.synth();
// https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/walkthrough-crossstackref.html
