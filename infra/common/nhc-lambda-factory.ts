import type { Construct } from 'constructs';
import {
  type LambdaAlarmConfig,
  NhcLambdaFunction
} from './nhc-lambda-function';
import { type NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { ResourceNamingService } from './resource-naming-service';
import { Effect, ManagedPolicy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { type NhsAlarmFactory } from './nhc-alarm-factory';
import * as cdk from 'aws-cdk-lib';
import { type IKey } from 'aws-cdk-lib/aws-kms';
import { getKmsKeyById } from './lib/utils';

interface NhcLambdaProps {
  name: string;
  environment?: Record<string, string>;
  additionalProps?: NodejsFunctionProps;
  alarmConfig?: LambdaAlarmConfig;
}

interface NHCEnvVariablesVPC {
  name: string;
  id: string;
  subnetIds: string[];
  securityGroups: string[];
}

interface NhcLambdaFactoryProps {
  common: {
    envName: string;
  };
  vpc: NHCEnvVariablesVPC;
  aws: {
    managementAccountId: string;
  };
  security: {
    kmsKeyId: string;
  };
}

export class NhcLambdaFactory {
  readonly managementAccountId: string;
  readonly kmsKeyId: string;
  public factoryVPC: Partial<NodejsFunctionProps>;
  private readonly namingService: ResourceNamingService;
  private readonly accountId: string;
  private readonly region: string;
  private readonly kmsKey: IKey;

  // eslint-disable-next-line max-params
  constructor(
    public scope: Construct,
    public stackBaseName: string,
    public envVars: NhcLambdaFactoryProps,
    private readonly alarmFactory: NhsAlarmFactory,
    public tracingEnabled: boolean = false,
    public amazonInspectorEnabled: boolean = false,
    public nhcName?: string
  ) {
    this.namingService = new ResourceNamingService(this.envVars.common.envName);
    this.managementAccountId = envVars.aws.managementAccountId;
    this.kmsKeyId = envVars.security.kmsKeyId;
    this.tracingEnabled = tracingEnabled;
    this.amazonInspectorEnabled = amazonInspectorEnabled;
    this.accountId = cdk.Stack.of(scope).account;
    this.region = cdk.Stack.of(scope).region;

    const vpcName = this.namingService.getEnvSpecificResourceName(
      'vpc',
      nhcName
    );
    this.factoryVPC = this.getVPC(this.scope, vpcName);

    this.kmsKey = getKmsKeyById(
      this.scope,
      'lambda-logs-kms-key',
      this.region,
      this.managementAccountId,
      this.kmsKeyId
    );
  }

  public createLambda(lambdaProps: NhcLambdaProps): NhcLambdaFunction {
    if (lambdaProps.additionalProps?.vpc !== undefined) {
      throw new Error(
        'Remove VPC from Properties as we use the Factory constructor args to set it'
      );
    }

    lambdaProps.additionalProps = {
      ...lambdaProps.additionalProps,
      ...this.factoryVPC
    };

    const lambda = new NhcLambdaFunction(
      {
        scope: this.scope,
        id: lambdaProps.name,
        stackName: this.stackBaseName,
        environment: lambdaProps.environment,
        additionalProps: lambdaProps.additionalProps,
        alarmsConfig: lambdaProps.alarmConfig,
        alarmFactory: this.alarmFactory,
        encryptionKey: this.kmsKey
      },
      this.nhcName
    );

    lambda.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['kms:Decrypt', 'kms:GenerateDataKey*'],
        resources: [
          `arn:aws:kms:eu-west-2:${this.managementAccountId}:key/${this.kmsKeyId}`
        ]
      })
    );

    const parameterStorePolicy = new PolicyStatement({
      actions: [
        'ssm:GetParameter',
        'ssm:GetParameters',
        'ssm:GetParametersByPath'
      ],
      resources: [
        `arn:aws:ssm:${this.region}:${this.accountId}:parameter/${this.envVars.common.envName}/dhc/*`
      ]
    });

    lambda.role?.addToPrincipalPolicy(parameterStorePolicy);

    if (this.tracingEnabled) {
      lambda.role?.addManagedPolicy(
        ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess')
      );
    }

    if (!this.amazonInspectorEnabled) {
      cdk.Tags.of(lambda).add('InspectorExclusion', 'LambdaStandardScanning');
    }

    return lambda;
  }

  private getVPC(
    scope: Construct,
    nameOfVPC: string
  ): Partial<NodejsFunctionProps> {
    return {
      vpc: ec2.Vpc.fromLookup(scope, `${nameOfVPC}`, {
        vpcId: this.envVars.vpc.id
      }),
      vpcSubnets: {
        subnets: this.envVars.vpc.subnetIds.map((subnetId, index) =>
          ec2.Subnet.fromSubnetId(
            scope,
            `${this.envVars.vpc.name}-subnet${index}`,
            subnetId
          )
        )
      },
      securityGroups: this.envVars.vpc.securityGroups.map(
        (securityGroupId, index) =>
          ec2.SecurityGroup.fromSecurityGroupId(
            scope,
            `${this.envVars.vpc.name}-sg${index}`,
            securityGroupId
          )
      )
    };
  }
}
