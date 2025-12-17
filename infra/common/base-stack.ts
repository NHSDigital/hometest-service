import { type CfnElement, Stack, Tags } from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Key, type IKey } from 'aws-cdk-lib/aws-kms';
import { type Construct } from 'constructs';
import { SuppressCheckovLambdaEncryptionEnv } from './suppress-checkov-lambda';
import * as cdk from 'aws-cdk-lib';
import { getKmsKeyById } from './lib/utils';

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

  public addCorsOptions(
    apiResource: apigateway.IResource,
    origin: string
  ): void {
    apiResource.addCorsPreflight({
      allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
      allowOrigins: [origin],
      allowCredentials: true,
      allowMethods: apigateway.Cors.ALL_METHODS
    });
  }

  public lookupKmsKeyByAlias(kmsKeyAliasName: string): IKey {
    return Key.fromLookup(this, `${this.stackBaseName}-kms-key-from-alias`, {
      aliasName: kmsKeyAliasName
    });
  }

  public getKmsKey(awsAccountId: string, kmsKeyAliasName: string): IKey {
    return Key.fromKeyArn(
      this,
      `${this.stackBaseName}-kms-key`,
      this.getKmsKeyAliasIdentifier(awsAccountId, kmsKeyAliasName)
    );
  }

  public getKmsKeyAliasIdentifier(
    awsAccountId: string,
    kmsKeyAliasName: string
  ): string {
    return `arn:aws:kms:${this.region}:${awsAccountId}:${kmsKeyAliasName}`;
  }

  public getKmsKeyIdentifier(awsAccountId: string, kmsKeyId: string): string {
    return `arn:aws:kms:${this.region}:${awsAccountId}:key/${kmsKeyId}`;
  }

  public getKmsKeyById(awsAccountId: string, kmsKeyId: string): IKey {
    return getKmsKeyById(
      this,
      `${this.stackBaseName}-kms-key-from-id`,
      this.region,
      awsAccountId,
      kmsKeyId
    );
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

export function translateRegionToCSOCDestinationArn(
  region: string | undefined
): string {
  switch (region) {
    case 'eu-west-2':
      return 'arn:aws:logs:eu-west-2:693466633220:destination:waf_log_destination'; // Hardcoded as per https://nhsd-confluence.digital.nhs.uk/spaces/CCEP/pages/394532589/WAF+v2+EU-West-2
    case 'us-east-1':
      return 'arn:aws:logs:us-east-1:693466633220:destination:waf_log_destination_virginia'; // Hardcoded as per https://nhsd-confluence.digital.nhs.uk/spaces/CCEP/pages/520329072/WAF+v2+US-East-1
    default:
      throw new ReferenceError(`Account ID: ${region} not defined`);
  }
}

export const ApiGatewayCustomLogFormat = apigateway.AccessLogFormat.custom(
  JSON.stringify({
    requestId: '$context.requestId',
    ip: '$context.identity.sourceIp',
    caller: '$context.identity.caller',
    user: '$context.identity.user',
    requestTime: '$context.requestTime',
    httpMethod: '$context.httpMethod',
    resourcePath: '$context.resourcePath',
    status: '$context.status',
    protocol: '$context.protocol',
    responseLength: '$context.responseLength',
    accountId: '$context.accountId',
    apiId: '$context.apiId',
    stage: '$context.stage',
    api_key: '$context.identity.apiKey'
  })
);
