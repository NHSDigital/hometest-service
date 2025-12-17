import { type Construct } from 'constructs';
import { BaseStack } from '../../common/base-stack';
import { type NhcLambdaFunction } from '../../common/nhc-lambda-function';
import { type ITable } from 'aws-cdk-lib/aws-dynamodb';
import type * as sqs from 'aws-cdk-lib/aws-sqs';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { NhcSqsQueue } from '../resources/nhc-sqs-queue';
import { type NHCEnvVariables } from '../settings';
import { type StackProps } from 'aws-cdk-lib';
import { NhcLambdaFactory } from '../../common/nhc-lambda-factory';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { type SqsRedriveSubscribeService } from './nhc-monitoring-stack';
import { type IKey } from 'aws-cdk-lib/aws-kms';
import { type ILogGroup } from 'aws-cdk-lib/aws-logs';
import { type NhsAlarmFactory } from '../../common/nhc-alarm-factory';

interface NhcOrderStackProps extends StackProps {
  healthCheckTable: ITable;
  orderTable: ITable;
  patientTable: ITable;
  auditEventsQueue: sqs.Queue;
  envVariables: NHCEnvVariables;
  sqsRedrive: SqsRedriveSubscribeService;
  alarmFactory: NhsAlarmFactory;
}

export class NhcOrderStack extends BaseStack {
  readonly kmsKey: IKey;
  public readonly labOrderQueue: NhcSqsQueue;
  public labOrderPlacementLambdaLogGroup: ILogGroup;

  constructor(scope: Construct, id: string, props: NhcOrderStackProps) {
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

    const lambdaFactory = new NhcLambdaFactory(
      this,
      this.stackBaseName,
      props.envVariables,
      props.alarmFactory,
      props.envVariables.tracingEnabled,
      props.envVariables.amazonInspectorEnabled
    );

    this.labOrderQueue = new NhcSqsQueue({
      scope: this,
      id: 'lab-order-queue',
      kmsKey: this.kmsKey,
      maxReceiveCount: +props.envVariables.sqsMaxReceiveCount,
      alarmFactory: props.alarmFactory
    });
    props.sqsRedrive.subscribe(this.labOrderQueue, {
      maxRetries: parseInt(
        props.envVariables.dlqRedriveConfig.maxRetriesLabOrderQueue
      )
    });

    this.createOrderPlacementLambda(
      lambdaFactory,
      this.labOrderQueue.mainQueue,
      props
    );
  }

  createOrderPlacementLambda(
    lambdaFactory: NhcLambdaFactory,
    queue: sqs.Queue,
    props: NhcOrderStackProps
  ): NhcLambdaFunction {
    const lambda = lambdaFactory.createLambda({
      name: 'lab-order-placement-lambda',
      environment: {
        THRIVA_AUTH_API_URL: props.envVariables.labOrder.thriva.authApiUrl,
        THRIVA_API_URL: props.envVariables.labOrder.thriva.apiUrl,
        THRIVA_AUDIENCE_URL: props.envVariables.labOrder.thriva.audienceUrl,
        THRIVA_SECRET_KEY_SECRET_NAME:
          props.envVariables.labOrder.thriva.secretKeySecretName,
        THRIVA_CLIENT_ID: props.envVariables.labOrder.thriva.clientIdSecretName,
        EVENTS_QUEUE_URL: props.auditEventsQueue.queueUrl,
        SQS_MAX_RECEIVE_COUNT: props.envVariables.sqsMaxReceiveCount
      },
      alarmConfig: { createLambdaErrorAlarm: false }
    });
    this.labOrderPlacementLambdaLogGroup = lambda.logGroup;

    const thrivaSecret = Secret.fromSecretNameV2(
      this,
      'thriva-auth-secret',
      props.envVariables.labOrder.thriva.secretKeySecretName
    );
    const thrivaClientId = Secret.fromSecretNameV2(
      this,
      'thriva-auth-client-id',
      props.envVariables.labOrder.thriva.clientIdSecretName
    );

    thrivaSecret.grantRead(lambda);
    thrivaClientId.grantRead(lambda);
    props.healthCheckTable.grantWriteData(lambda);
    props.healthCheckTable.grantReadData(lambda);
    props.orderTable.grantWriteData(lambda);
    props.orderTable.grantReadData(lambda);
    props.auditEventsQueue.grantSendMessages(lambda);

    lambda.addEventSource(
      new SqsEventSource(queue, {
        reportBatchItemFailures: true,
        batchSize: 1
      })
    );
    return lambda;
  }
}
