import { BaseStack } from '../../common/base-stack';
import { type Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { type NhcLambdaFunction } from '../../common/nhc-lambda-function';
import * as cdk from 'aws-cdk-lib';
import path = require('path');
import { type NHCEnvVariables } from '../settings';
import { NhcBucketFactory } from '../../common/nhc-bucket-factory';
import { NhcLambdaFactory } from '../../common/nhc-lambda-factory';
import { type IKey } from 'aws-cdk-lib/aws-kms';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { BucketEncryption } from 'aws-cdk-lib/aws-s3';
import { type NhsAlarmFactory } from '../../common/nhc-alarm-factory';
import * as s3Notifications from 'aws-cdk-lib/aws-s3-notifications';
import { type NhcDbStack } from './nhc-db-stack';

interface NhcDataLoadStackProps extends cdk.StackProps {
  alarmFactory: NhsAlarmFactory;
  envVariables: NHCEnvVariables;
  dbStack: NhcDbStack;
}

export class NhcDataLoadStack extends BaseStack {
  readonly kmsKey: IKey;
  readonly managementAccountId: string;
  readonly kmsKeyId: string;
  readonly dbStack: NhcDbStack;

  constructor(scope: Construct, id: string, props: NhcDataLoadStackProps) {
    super(
      scope,
      id,
      props.envVariables.common.envName,
      props.envVariables.nhcVersion
    );
    this.managementAccountId = props.envVariables.aws.managementAccountId;
    this.kmsKeyId = props.envVariables.security.kmsKeyId;
    this.dbStack = props.dbStack;

    this.kmsKey = this.getKmsKeyById(
      props.envVariables.aws.managementAccountId,
      this.kmsKeyId
    );

    const lambdaFactory = new NhcLambdaFactory(
      this,
      this.stackBaseName,
      props.envVariables,
      props.alarmFactory,
      props.envVariables.tracingEnabled,
      props.envVariables.amazonInspectorEnabled
    );

    const dataBucket = this.createDataLoadBucket(props);
    this.createDataLoadLambda(dataBucket, lambdaFactory);
    this.syncData(dataBucket, props.envVariables.envType);

    const autoDataBucket = this.createAutoDataLoadBucket(props);
    const autoDataLoadLambda = this.createAutoDataLoadLambda(
      autoDataBucket,
      lambdaFactory
    );

    autoDataBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3Notifications.LambdaDestination(autoDataLoadLambda),
      { suffix: '.json', prefix: 'input/' }
    );
  }

  createDataLoadLambda(
    dataBucket: s3.Bucket,
    lambdaFactory: NhcLambdaFactory
  ): NhcLambdaFunction {
    const dataLoadLambda = lambdaFactory.createLambda({
      name: 'db-data-load-lambda',
      environment: {
        DATA_BUCKET: dataBucket.bucketName
      }
    });

    dataBucket.grantRead(dataLoadLambda);
    dataLoadLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['dynamodb:PutItem', 'dynamodb:BatchWriteItem'],
        resources: [
          `arn:aws:dynamodb:${cdk.Stack.of(this).region}:${
            cdk.Stack.of(this).account
          }:table/*`
        ]
      })
    );
    return dataLoadLambda;
  }

  createAutoDataLoadLambda(
    autoBucket: s3.Bucket,
    lambdaFactory: NhcLambdaFactory
  ): NhcLambdaFunction {
    const autoDataLoadLambda = lambdaFactory.createLambda({
      name: 'auto-db-data-load-lambda',
      additionalProps: { timeout: cdk.Duration.minutes(15), memorySize: 4096 },
      alarmConfig: { durationAlarmThreshold: cdk.Duration.minutes(14) }
    });

    autoBucket.grantReadWrite(autoDataLoadLambda);
    autoBucket.grantDelete(autoDataLoadLambda);

    autoDataLoadLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['dynamodb:PutItem', 'dynamodb:BatchWriteItem'],
        resources: [
          this.dbStack.lsoaImdMappingTable.tableArn,
          this.dbStack.gpOdsCodeTable.tableArn,
          this.dbStack.postcodeLsoaMappingTable.tableArn,
          this.dbStack.snomedTable.tableArn
        ]
      })
    );

    return autoDataLoadLambda;
  }

  createDataLoadBucket(props: NhcDataLoadStackProps): s3.Bucket {
    const bucketName = `${this.account}-${this.envName}-nhc-db-data-load-bucket`;
    return new NhcBucketFactory().create({
      scope: this,
      id: 'nhc-db-data-load-bucket',
      bucketName,
      accessLoggingBucketName: props.envVariables.accessLoggingBucketName,
      envType: props.envVariables.envType,
      accountNumber: this.account,
      removalPolicy: props.envVariables.aws.removalPolicy,
      additionalProps: {
        encryption: BucketEncryption.KMS,
        encryptionKey: this.kmsKey
      }
    });
  }

  createAutoDataLoadBucket(props: NhcDataLoadStackProps): s3.Bucket {
    const bucketName = `${this.account}-${this.envName}-nhc-auto-db-data-load-bucket`;
    return new NhcBucketFactory().create({
      scope: this,
      id: 'nhc-auto-db-data-load-bucket',
      bucketName,
      accessLoggingBucketName: props.envVariables.accessLoggingBucketName,
      envType: props.envVariables.envType,
      accountNumber: this.account,
      removalPolicy: props.envVariables.aws.removalPolicy,
      additionalProps: {
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: this.kmsKey
      }
    });
  }

  syncData(dataBucket: s3.Bucket, envType: string): s3deploy.BucketDeployment {
    const siteDeploymentName = `${this.envName}-nhc-site-deployment`;
    const dirPath = `./../../../data/db/${envType}/`;

    const bucketDeployment = new s3deploy.BucketDeployment(
      this,
      siteDeploymentName,
      {
        sources: [s3deploy.Source.asset(path.join(__dirname, dirPath))],
        destinationBucket: dataBucket,
        retainOnDelete: false
      }
    );

    bucketDeployment.handlerRole.addToPrincipalPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['kms:Decrypt', 'kms:GenerateDataKey*'],
        resources: [
          `arn:aws:kms:eu-west-2:${this.managementAccountId}:key/${this.kmsKeyId}`
        ]
      })
    );

    return bucketDeployment;
  }
}
