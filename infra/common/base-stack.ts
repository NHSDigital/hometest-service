import * as cdk from 'aws-cdk-lib';
import {type CfnElement, Stack, Tags} from 'aws-cdk-lib';
import {type Construct} from 'constructs';
import {SuppressCheckovLambdaEncryptionEnv} from './suppress-checkov-lambda';

export class BaseStack extends Stack {
  readonly envName: string;
  readonly stackBaseName: string;
  readonly version: string;

  private static readonly forbiddenEnvNames = [
    'prod',
    'int',
    'demo',
    'test',
    'develop'
  ];

  // eslint-disable-next-line max-params
  constructor(
    scope: Construct,
    id: string,
    envName: string,
    version: string,
    region = process.env.CDK_DEFAULT_REGION,
    crossRegionReferences: boolean = false
  ) {
    const isRunFromPipeline = process.env.IS_RUN_FROM_PIPELINE === 'true';
    if (
      !isRunFromPipeline &&
      BaseStack.forbiddenEnvNames.includes(envName.toLowerCase())
    ) {
      throw new Error(
        `Deployment to environment "${envName}" is forbidden from local machine!`
      );
    }

    const terminationProtection =
      process.env.STACK_TERMINATION_PROTECTION_ENABLED === 'true';

    super(scope, addEnvPrefixToPhysicalId(envName, id), {
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region
      },
      crossRegionReferences,
      terminationProtection
    });

    this.envName = envName;
    this.stackBaseName = id;
    this.version = version;
    this.tagAllStackResources();
    cdk.Aspects.of(this).add(new SuppressCheckovLambdaEncryptionEnv());
  }

  public allocateLogicalId(element: CfnElement): string {
    const originalLogicalId = super.allocateLogicalId(element);
    return addEnvPrefixToLogicalId(this.envName, originalLogicalId);
  }
  private tagAllStackResources(): void {
    if (this.envName !== '') {
      Tags.of(this).add('nhc_env', this.envName);
    }
  }
}

export function addEnvPrefixToPhysicalId(
  prefix: string,
  resourceName: string
): string {
  return `${prefix}-${resourceName}`;
}

function addEnvPrefixToLogicalId(prefix: string, resourceName: string): string {
  return `${prefix}${resourceName}`;
}
