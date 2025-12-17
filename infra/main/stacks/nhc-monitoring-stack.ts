/* eslint-disable no-new */
import { BaseStack } from '../../common/base-stack';
import { type Construct } from 'constructs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as rum from 'aws-cdk-lib/aws-rum';
import { ResourceNamingService } from '../../common/resource-naming-service';
import { CfnOutput, Duration, type StackProps } from 'aws-cdk-lib';
import { type NHCEnvVariables } from '../settings';
import {
  CfnIdentityPool,
  CfnIdentityPoolRoleAttachment
} from 'aws-cdk-lib/aws-cognito';
import {
  Effect,
  FederatedPrincipal,
  PolicyStatement,
  Role
} from 'aws-cdk-lib/aws-iam';
import { NhcLambdaFactory } from '../../common/nhc-lambda-factory';
import { type NhcLambdaFunction } from '../../common/nhc-lambda-function';
import { type ITable } from 'aws-cdk-lib/aws-dynamodb';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { type NhcSqsQueue } from '../resources/nhc-sqs-queue';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { type NhsAlarmFactory } from '../../common/nhc-alarm-factory';

interface NhcMonitoringStackProps extends StackProps {
  deadLetterMessagesDbTable: ITable;
  envVariables: NHCEnvVariables;
  alarmFactory: NhsAlarmFactory;
}

interface DlqConfig {
  maxRetries: number;
}

export class NhcMonitoringStack extends BaseStack {
  public readonly qriskFailuresMetric: cloudwatch.Metric;
  public readonly appMonitorIdentityPool: CfnIdentityPool;
  private readonly collectDlqMessagesLambda: NhcLambdaFunction;
  public readonly redriveDlqMessagesLambda: NhcLambdaFunction;
  public sqsRedrive: SqsRedriveSubscribeService;

  constructor(scope: Construct, id: string, props: NhcMonitoringStackProps) {
    super(
      scope,
      id,
      props.envVariables.common.envName,
      props.envVariables.nhcVersion
    );
    const namingService = new ResourceNamingService(
      props.envVariables.common.envName
    );
    const lambdaFactory = new NhcLambdaFactory(
      this,
      this.stackBaseName,
      props.envVariables,
      props.alarmFactory,
      props.envVariables.tracingEnabled,
      props.envVariables.amazonInspectorEnabled
    );

    this.qriskFailuresMetric = new cloudwatch.Metric({
      namespace: 'nhc.results',
      metricName: `${props.envVariables.common.envName}QriskFailures`,
      statistic: cloudwatch.Stats.SUM,
      dimensionsMap: {
        service: 'risk-calc'
      }
    });

    const qriskFailureAlarmName = 'qrisk-failure';
    props.alarmFactory.create(this, qriskFailureAlarmName, {
      metric: this.qriskFailuresMetric,
      threshold: 1,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription:
        'Alarm triggered when at least one QRisk calculation failure occurs',
      alarmName: namingService.getEnvSpecificResourceName(qriskFailureAlarmName)
    });

    this.collectDlqMessagesLambda = lambdaFactory.createLambda({
      name: 'collect-dlq-messages-lambda',
      environment: {}
    });
    props.deadLetterMessagesDbTable.grantWriteData(
      this.collectDlqMessagesLambda
    );

    const collectDlqMessagesLambdaInvocationsMetric = new cloudwatch.Metric({
      namespace: 'AWS/Lambda',
      metricName: 'Invocations',
      statistic: cloudwatch.Stats.SUM,
      period: Duration.minutes(5),
      dimensionsMap: {
        FunctionName: this.collectDlqMessagesLambda.functionName
      }
    });

    const collectDlqMessagesLambdaInvokedAlarmName =
      'collect-dlq-messages-lambda-invoked';
    props.alarmFactory.create(this, collectDlqMessagesLambdaInvokedAlarmName, {
      metric: collectDlqMessagesLambdaInvocationsMetric,
      threshold: 1,
      evaluationPeriods: 3,
      datapointsToAlarm: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription:
        'Alarm triggered when collectDlqMessagesLambda was invoked',
      alarmName: namingService.getEnvSpecificResourceName(
        collectDlqMessagesLambdaInvokedAlarmName
      )
    });

    this.redriveDlqMessagesLambda = lambdaFactory.createLambda({
      name: 'redrive-dlq-messages-lambda',
      environment: {
        DLQ_REDRIVE_MAX_RETRIES_DEFAULT:
          props.envVariables.dlqRedriveConfig.maxRetriesDefault,
        AWS_ACCOUNT_ID: this.account
      },
      additionalProps: {
        timeout: Duration.minutes(15)
      },
      alarmConfig: {
        createLambdaDurationAlarm: true,
        durationAlarmThreshold: Duration.minutes(10),
        createLambdaNotInvokedAlarm: true,
        createLambdaNotInvokedAlarmPeriod: Duration.hours(24)
      }
    });

    props.deadLetterMessagesDbTable.grantReadWriteData(
      this.redriveDlqMessagesLambda
    );

    new Rule(this, 'automatic-sqs-redrive-rule', {
      schedule: Schedule.cron({ minute: '0', hour: '1' }), // 1AM or 2AM UK time
      targets: [new LambdaFunction(this.redriveDlqMessagesLambda)],
      enabled: props.envVariables.dlqRedriveConfig.autoRedriveEnabled
    });
    this.sqsRedrive = new SqsRedriveSubscribeService(
      this.collectDlqMessagesLambda,
      this.redriveDlqMessagesLambda
    );

    /**
     * Create App Monitor with required resources
     */
    const appMonitorName =
      namingService.getEnvSpecificResourceName('app-monitor');

    this.appMonitorIdentityPool = new CfnIdentityPool(
      this,
      'app-monitor-identity-pool',
      {
        identityPoolName: namingService.getEnvSpecificResourceName(
          'app-monitor-identity-pool'
        ),
        allowUnauthenticatedIdentities: false,
        developerProviderName: namingService.getEnvSpecificResourceName(
          'app-monitor-identity-provider'
        )
      }
    );

    const identityPoolRole = new Role(this, 'app-monitor-role', {
      assumedBy: new FederatedPrincipal(
        'cognito-identity.amazonaws.com',
        {
          StringEquals: {
            'cognito-identity.amazonaws.com:aud':
              this.appMonitorIdentityPool.ref
          },
          'ForAnyValue:StringLike': {
            'cognito-identity.amazonaws.com:amr': 'authenticated'
          }
        },
        'sts:AssumeRoleWithWebIdentity'
      )
    });
    identityPoolRole.addToPolicy(
      new PolicyStatement({
        actions: ['rum:PutRumEvents'],
        effect: Effect.ALLOW,
        resources: [
          `arn:aws:rum:eu-west-2:${this.account}:appmonitor/${appMonitorName}`
        ]
      })
    );

    new CfnIdentityPoolRoleAttachment(this, 'AuthRoleAttachment', {
      identityPoolId: this.appMonitorIdentityPool.ref,
      roles: {
        authenticated: identityPoolRole.roleArn
      }
    });

    const appMonitor = new rum.CfnAppMonitor(this, 'app-monitor', {
      name: appMonitorName,
      domain: `${this.envName}.${props.envVariables.aws.cloudfrontDomainName}`,
      appMonitorConfiguration: {
        identityPoolId: this.appMonitorIdentityPool.ref,
        sessionSampleRate: 1, // 100%
        telemetries: []
      },
      customEvents: {
        status: 'ENABLED'
      },
      cwLogEnabled: props.envVariables.rumCloudwatchLogsEnabled
    });

    new CfnOutput(this, 'IdentityPoolId', {
      value: this.appMonitorIdentityPool.ref
    });
    new CfnOutput(this, 'AppMonitorId', {
      value: appMonitor.attrId
    });
  }
}

export class SqsRedriveSubscribeService {
  private readonly collectDlqMessagesLambda: NhcLambdaFunction;
  private readonly redriveDlqMessagesLambda: NhcLambdaFunction;

  public constructor(
    collectDlqMessagesLambda: NhcLambdaFunction,
    redriveDlqMessagesLambda: NhcLambdaFunction
  ) {
    this.collectDlqMessagesLambda = collectDlqMessagesLambda;
    this.redriveDlqMessagesLambda = redriveDlqMessagesLambda;
  }

  public subscribe(queue: NhcSqsQueue, dlqConfig?: DlqConfig): void {
    this.collectDlqMessagesLambda.addEventSource(
      new SqsEventSource(queue.dlQueue, {
        reportBatchItemFailures: true
      })
    );
    queue.dlQueue.grantConsumeMessages(this.collectDlqMessagesLambda);
    queue.mainQueue.grantSendMessages(this.redriveDlqMessagesLambda);

    if (dlqConfig?.maxRetries !== undefined) {
      const queueName = `MAX_RETRIES_${queue.queueName}`;
      this.redriveDlqMessagesLambda.addEnvironment(
        queueName,
        dlqConfig.maxRetries.toString()
      );
    }
  }
}
