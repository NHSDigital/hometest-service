import { BaseStack } from '../../common/base-stack';
import type { StackProps } from 'aws-cdk-lib';
import { type Construct } from 'constructs';
import type * as sqs from 'aws-cdk-lib/aws-sqs';
import { NhcSqsQueue } from '../resources/nhc-sqs-queue';
import { type NHCEnvVariables } from '../settings';
import { type IKey } from 'aws-cdk-lib/aws-kms';
import { type NhsAlarmFactory } from '../../common/nhc-alarm-factory';
import {
  Effect,
  PolicyStatement,
  ArnPrincipal,
  AccountRootPrincipal
} from 'aws-cdk-lib/aws-iam';
import { NhcLambdaFactory } from '../../common/nhc-lambda-factory';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { type ITable } from 'aws-cdk-lib/aws-dynamodb';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import * as cdk from 'aws-cdk-lib';

interface NhcMnsProps extends StackProps {
  envVariables: NHCEnvVariables;
  alarmFactory: NhsAlarmFactory;
  mnsMessagesLogTable: ITable;
  auditEventsQueue: sqs.Queue;
}

export class NhcMnsStack extends BaseStack {
  readonly kmsKey: IKey;
  readonly mnsEncryptionKey: IKey;
  readonly mnsOutboundQueue: NhcSqsQueue;
  readonly mnsInboundQueue: NhcSqsQueue;
  readonly mnsEventsLambdaDeliveryRole: string;

  constructor(scope: Construct, id: string, props: NhcMnsProps) {
    super(
      scope,
      id,
      props.envVariables.common.envName,
      props.envVariables.nhcVersion
    );

    this.kmsKey = this.getKmsKeyById(
      props.envVariables.aws.managementAccountId,
      props.envVariables.security.kmsKeyId
    );

    this.mnsEncryptionKey = this.lookupKmsKeyByAlias('alias/mnsEncryptionKey');

    const lambdaFactory = new NhcLambdaFactory(
      this,
      this.stackBaseName,
      props.envVariables,
      props.alarmFactory,
      props.envVariables.tracingEnabled,
      props.envVariables.amazonInspectorEnabled
    );

    this.mnsOutboundQueue = new NhcSqsQueue({
      scope: this,
      id: 'mns-outbound',
      kmsKey: this.kmsKey,
      maxReceiveCount: +props.envVariables.sqsMaxReceiveCount,
      alarmFactory: props.alarmFactory
    });

    this.mnsInboundQueue = new NhcSqsQueue({
      scope: this,
      id: 'mns-inbound',
      kmsKey: this.mnsEncryptionKey,
      maxReceiveCount: +props.envVariables.sqsMaxReceiveCount,
      alarmFactory: props.alarmFactory
    });

    this.mnsInboundQueue.mainQueue.addToResourcePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        principals: [new AccountRootPrincipal()],
        actions: [
          'sqs:SendMessage',
          'sqs:ReceiveMessage',
          'sqs:DeleteMessage',
          'sqs:GetQueueAttributes'
        ],
        resources: [this.mnsInboundQueue.mainQueue.queueArn]
      })
    );
    if (props.envVariables.mns.eventsLambdaDeliveryRole) {
      this.mnsInboundQueue.mainQueue.addToResourcePolicy(
        new PolicyStatement({
          effect: Effect.ALLOW,
          principals: [
            new ArnPrincipal(props.envVariables.mns.eventsLambdaDeliveryRole)
          ],
          actions: [
            'sqs:SendMessage',
            'sqs:ReceiveMessage',
            'sqs:DeleteMessage',
            'sqs:GetQueueAttributes'
          ],
          resources: [this.mnsInboundQueue.mainQueue.queueArn]
        })
      );
    }

    const mnsApiKeySecret = Secret.fromSecretNameV2(
      this,
      'mns-api-key',
      props.envVariables.nhsApiPlatform.apiKeySecretName
    );
    const mnsPrivateKey = Secret.fromSecretNameV2(
      this,
      'mns-private-key',
      props.envVariables.nhsApiPlatform.privateKeySecretName
    );

    const mnsMessageProducerLambda = lambdaFactory.createLambda({
      name: 'mns-message-producer-lambda',
      environment: {
        NHS_API_PLATFORM_BASE_URL: props.envVariables.nhsApiPlatform.baseUrl,
        NHS_API_PLATFORM_API_KEY_SECRET_NAME:
          props.envVariables.nhsApiPlatform.apiKeySecretName,
        NHS_API_PLATFORM_PRIVATE_KEY_SECRET_NAME:
          props.envVariables.nhsApiPlatform.privateKeySecretName,
        NHS_API_PLATFORM_KEY_ID: props.envVariables.nhsApiPlatform.keyId,
        MNS_JWT_EXPIRATION_TIME_SECONDS:
          props.envVariables.mns.jwtExpirationTimeSeconds,
        MNS_OUTBOUND_QUEUE_URL: this.mnsOutboundQueue.mainQueue.queueUrl,
        EVENTS_QUEUE_URL: props.auditEventsQueue.queueUrl
      },
      alarmConfig: { createLambdaErrorAlarm: true }
    });

    this.mnsOutboundQueue.mainQueue.grantConsumeMessages(
      mnsMessageProducerLambda
    );
    props.auditEventsQueue.grantSendMessages(mnsMessageProducerLambda);
    props.mnsMessagesLogTable.grantWriteData(mnsMessageProducerLambda);
    mnsApiKeySecret.grantRead(mnsMessageProducerLambda);
    mnsPrivateKey.grantRead(mnsMessageProducerLambda);

    mnsMessageProducerLambda.addEventSource(
      new SqsEventSource(this.mnsOutboundQueue.mainQueue, {
        reportBatchItemFailures: true,
        batchSize: 1
      })
    );

    const mnsMessageConsumerLambda = lambdaFactory.createLambda({
      name: 'mns-message-consumer-lambda',
      environment: {
        NHS_API_PLATFORM_BASE_URL: props.envVariables.nhsApiPlatform.baseUrl
      },
      alarmConfig: { createLambdaErrorAlarm: true }
    });

    this.mnsInboundQueue.mainQueue.grantConsumeMessages(
      mnsMessageConsumerLambda
    );

    props.mnsMessagesLogTable.grantReadWriteData(mnsMessageConsumerLambda);

    const accountId = cdk.Stack.of(this).account;

    mnsMessageConsumerLambda.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['kms:Decrypt', 'kms:GenerateDataKey*'],
        resources: [`arn:aws:kms:eu-west-2:${accountId}:alias/mnsEncryptionKey`]
      })
    );

    mnsMessageConsumerLambda.addEventSource(
      new SqsEventSource(this.mnsInboundQueue.mainQueue, {
        reportBatchItemFailures: true,
        batchSize: 1
      })
    );
  }
}
