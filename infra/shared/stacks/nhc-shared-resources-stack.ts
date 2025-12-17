import { CfnOutput, type StackProps } from 'aws-cdk-lib';
import { type Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { BaseStack } from '../../common/base-stack';
import { type NHCEnvVariables } from '../settings';
import { NhcBucketFactory } from '../../common/nhc-bucket-factory';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { BucketEncryption } from 'aws-cdk-lib/aws-s3';
import * as path from 'path';
import { AccountName } from '../../common/lib/enums';
import { Key, type IKey } from 'aws-cdk-lib/aws-kms';
import { AWSAccountNumbers } from '../../../shared';

export interface NhcSharedResourcesStackProps extends StackProps {
  envVariables: NHCEnvVariables;
}

export class NhcSharedResourcesStack extends BaseStack {
  readonly kmsKey: IKey;
  readonly managementAccountId: string;
  readonly kmsKeyId: string;
  readonly mnsEncryptionKey: IKey;
  readonly mnsEventsLambdaDeliveryRole: string;
  constructor(
    scope: Construct,
    id: string,
    props: NhcSharedResourcesStackProps
  ) {
    super(scope, id, 'shared', props.envVariables.nhcVersion);

    this.managementAccountId = props.envVariables.aws.managementAccountId;
    this.kmsKeyId = props.envVariables.security.kmsKeyId;

    this.kmsKey = this.getKmsKeyById(
      props.envVariables.aws.managementAccountId,
      this.kmsKeyId
    );

    const policyStatements: iam.PolicyStatement[] = [
      new iam.PolicyStatement({
        sid: 'Enable IAM User Permissions',
        effect: iam.Effect.ALLOW,
        principals: [new iam.AccountRootPrincipal()],
        actions: ['kms:*'],
        resources: ['*']
      })
    ];

    if (props.envVariables.mns.eventsLambdaDeliveryRole) {
      policyStatements.push(
        new iam.PolicyStatement({
          sid: 'AllowMNSLambdaDelivery',
          effect: iam.Effect.ALLOW,
          principals: [
            new iam.ArnPrincipal(
              props.envVariables.mns.eventsLambdaDeliveryRole
            )
          ],
          actions: ['kms:GenerateDataKey'],
          resources: ['*']
        })
      );
    }

    this.mnsEncryptionKey = new Key(this, 'mns-encryption-key', {
      description: 'KMS key for MNS encryption',
      enableKeyRotation: true,
      alias: 'alias/mnsEncryptionKey',
      policy: new iam.PolicyDocument({
        statements: policyStatements
      })
    });

    const cloudWatchLogsRole = new iam.Role(
      this,
      'ApiGatewayCloudWatchLogsRole',
      {
        roleName: 'nhc-shared-api-gateway-cw-role',
        assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AmazonAPIGatewayPushToCloudWatchLogs'
          )
        ]
      }
    );

    const cfnAccount = new apigateway.CfnAccount(this, 'ApiGatewayAccount', {
      cloudWatchRoleArn: cloudWatchLogsRole.roleArn
    });
    cfnAccount.node.addDependency(cloudWatchLogsRole);

    this.createTrustStoreBucket(props);
    if (props.envVariables.common.accountName === AccountName.POC) {
      this.createPerfResultsStoreBucket(props);
    }
  }

  createPerfResultsStoreBucket(props: NhcSharedResourcesStackProps): void {
    const perfresultsBucket = new NhcBucketFactory().create({
      scope: this,
      id: 'nhc-perfresults-bucket',
      bucketName: `${this.account}-perf-results-bucket`,
      accessLoggingBucketName: props.envVariables.accessLoggingBucketName,
      envType: props.envVariables.envType,
      accountNumber: this.account,
      removalPolicy: props.envVariables.awsResourcesRemovalPolicy
    });

    new CfnOutput(this, 'PerfResultsBucketName', {
      value: perfresultsBucket.bucketName,
      description: 'S3 bucket for storing performance test results'
    });
  }

  createTrustStoreBucket(
    props: NhcSharedResourcesStackProps
  ): s3deploy.BucketDeployment {
    const truststoreBucket = new NhcBucketFactory().create({
      scope: this,
      id: 'nhc-truststore-bucket',
      bucketName: `${this.account}-truststore-bucket`,
      accessLoggingBucketName: props.envVariables.accessLoggingBucketName,
      envType: props.envVariables.envType,
      accountNumber: this.account,
      removalPolicy: props.envVariables.awsResourcesRemovalPolicy,
      additionalProps:
        this.account === AWSAccountNumbers.POC
          ? {
              encryption: BucketEncryption.S3_MANAGED
            }
          : {
              encryption: BucketEncryption.KMS,
              encryptionKey: this.kmsKey
            },
      versioned: true
    });

    const siteDeploymentName = `${this.envName}-nhc-deployment-ca-bundle`;

    const bucketDeployment = new s3deploy.BucketDeployment(
      this,
      siteDeploymentName,
      {
        sources: [
          s3deploy.Source.asset(
            path.join(
              __dirname,
              `./../../../data/certs/${props.envVariables.common.accountName}`
            )
          )
        ],
        destinationBucket: truststoreBucket
      }
    );

    new CfnOutput(this, 'TruststoreBucketName', {
      value: truststoreBucket.bucketName,
      description: 'S3 bucket for storing CA certificates'
    });

    return bucketDeployment;
  }
}
