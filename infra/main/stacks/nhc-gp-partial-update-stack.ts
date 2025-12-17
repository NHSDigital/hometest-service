import { type Construct } from 'constructs';
import { BaseStack } from '../../common/base-stack';
import { type ITable } from 'aws-cdk-lib/aws-dynamodb';
import { Duration, type StackProps } from 'aws-cdk-lib';
import { NhcSqsQueue } from '../resources/nhc-sqs-queue';
import { type NHCEnvVariables } from '../settings';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { NhcLambdaFactory } from '../../common/nhc-lambda-factory';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { type Queue } from 'aws-cdk-lib/aws-sqs';
import { type NhcLambdaFunction } from '../../common/nhc-lambda-function';
import { type Bucket } from 'aws-cdk-lib/aws-s3';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { type SqsRedriveSubscribeService } from './nhc-monitoring-stack';
import { type IKey } from 'aws-cdk-lib/aws-kms';
import { type NhsAlarmFactory } from '../../common/nhc-alarm-factory';
import path = require('path');

interface NhcGpPartialUpdateProps extends StackProps {
  gpUpdateSchedulerDbTable: ITable;
  healthCheckDbTable: ITable;
  patientDbTable: ITable;
  snomedDbTable: ITable;
  labResultDbTable: ITable;
  odsCodeDbTable: ITable;
  auditEventsQueue: Queue;
  pdmQueue: Queue;
  envVariables: NHCEnvVariables;
  getActiveUserLambda: NhcLambdaFunction;
  emisPayloadBucket: Bucket;
  gpNotificationQueue: Queue;
  sqsRedrive: SqsRedriveSubscribeService;
  alarmFactory: NhsAlarmFactory;
}

const EMIS_FUNCTIONS_DURATION_SECONDS = 60;

export class NhcGpPartialUpdateStack extends BaseStack {
  readonly kmsKey: IKey;
  public readonly gpUpdateSchedulerSqs: NhcSqsQueue;

  constructor(scope: Construct, id: string, props: NhcGpPartialUpdateProps) {
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

    this.gpUpdateSchedulerSqs = new NhcSqsQueue({
      scope: this,
      id: 'gp-update-scheduler',
      kmsKey: this.kmsKey,
      isFifo: true,
      additionalProperties: {
        visibilityTimeout: Duration.seconds(EMIS_FUNCTIONS_DURATION_SECONDS + 5)
      },
      maxReceiveCount: +props.envVariables.sqsMaxReceiveCount,
      alarmFactory: props.alarmFactory
    });
    props.sqsRedrive.subscribe(this.gpUpdateSchedulerSqs);

    const lambdaFactory = new NhcLambdaFactory(
      this,
      this.stackBaseName,
      props.envVariables,
      props.alarmFactory,
      props.envVariables.tracingEnabled,
      props.envVariables.amazonInspectorEnabled
    );

    const gpUpdateScheduleProcessorLambda = lambdaFactory.createLambda({
      name: 'gp-update-schedule-processor-lambda',
      additionalProps: {
        timeout: Duration.minutes(15),
        reservedConcurrentExecutions: 1
      },
      environment: {
        GP_UPDATE_SCHEDULER_QUEUE_URL:
          this.gpUpdateSchedulerSqs.mainQueue.queueUrl,
        EVENTS_QUEUE_URL: props.auditEventsQueue.queueUrl
      },
      alarmConfig: {
        createLambdaDurationAlarm: true,
        durationAlarmThreshold: Duration.minutes(10),
        createLambdaNotInvokedAlarm: true,
        createLambdaNotInvokedAlarmPeriod: Duration.hours(3)
      }
    });

    props.gpUpdateSchedulerDbTable.grantReadWriteData(
      gpUpdateScheduleProcessorLambda
    );
    props.healthCheckDbTable.grantReadData(gpUpdateScheduleProcessorLambda);
    props.patientDbTable.grantReadData(gpUpdateScheduleProcessorLambda);

    this.gpUpdateSchedulerSqs.mainQueue.grantSendMessages(
      gpUpdateScheduleProcessorLambda
    );
    props.auditEventsQueue.grantSendMessages(gpUpdateScheduleProcessorLambda);

    new Rule(this, 'gp-update-schedule-rule', {
      schedule: Schedule.rate(
        Duration.hours(+props.envVariables.gpUpdateScheduleIntervalInHours)
      ),
      targets: [new LambdaFunction(gpUpdateScheduleProcessorLambda)]
    });

    const gpPartialUpdatePatientRecordLambda = lambdaFactory.createLambda({
      name: 'gp-partial-update-patient-record-lambda',
      additionalProps: {
        timeout: Duration.seconds(EMIS_FUNCTIONS_DURATION_SECONDS),
        bundling: {
          commandHooks: {
            beforeBundling(inputDir: string, outputDir: string): string[] {
              const certFilePath = path.join(
                __dirname,
                '../../../data/certs/ca_bundle.pem'
              );
              return [`cp ${certFilePath} ${outputDir}/ca_bundle.pem`];
            },
            afterBundling(): string[] {
              return [''];
            },
            beforeInstall(): string[] {
              return [''];
            }
          }
        }
      },
      environment: {
        NODE_EXTRA_CA_CERTS: '/var/task/ca_bundle.pem',
        EVENTS_QUEUE_URL: props.auditEventsQueue.queueUrl,
        PDM_QUEUE_URL: props.pdmQueue.queueUrl,
        EMIS_MACHINE_NAME: props.envVariables.emis.machineName,
        EMIS_PRIVATE_KEY_SECRET_NAME:
          props.envVariables.emis.privateKeySecretName,
        EMIS_PUBLIC_CERT_SECRET_NAME:
          props.envVariables.emis.publicCertSecretName,
        EMIS_CERTIFICATE_COMMON_NAME:
          props.envVariables.emis.certificateCommonName,
        EMIS_FILE_RECORD_CONFIG: JSON.stringify({
          ...props.envVariables.emis.commonPayloadConfig,
          ...props.envVariables.emis.fileRecordPayloadConfig,
          apiUrl: props.envVariables.emis.transactionApiUri
        }),
        GET_ACTIVE_USER_LAMBDA_NAME: props.getActiveUserLambda.functionName,
        EMIS_PAYLOAD_BUCKET_NAME: props.emisPayloadBucket.bucketName,
        GP_NOTIFICATION_QUEUE_URL: props.gpNotificationQueue.queueUrl,
        SQS_MAX_RECEIVE_COUNT: props.envVariables.sqsMaxReceiveCount
      },
      alarmConfig: { createLambdaErrorAlarm: false }
    });

    props.emisPayloadBucket.grantWrite(gpPartialUpdatePatientRecordLambda);
    props.getActiveUserLambda.grantInvoke(gpPartialUpdatePatientRecordLambda);
    props.auditEventsQueue.grantSendMessages(
      gpPartialUpdatePatientRecordLambda
    );
    props.pdmQueue.grantSendMessages(gpPartialUpdatePatientRecordLambda);
    props.gpNotificationQueue.grantSendMessages(
      gpPartialUpdatePatientRecordLambda
    );
    props.healthCheckDbTable.grantReadWriteData(
      gpPartialUpdatePatientRecordLambda
    );
    props.gpUpdateSchedulerDbTable.grantReadWriteData(
      gpPartialUpdatePatientRecordLambda
    );
    props.snomedDbTable.grantReadData(gpPartialUpdatePatientRecordLambda);
    props.labResultDbTable.grantReadData(gpPartialUpdatePatientRecordLambda);
    props.odsCodeDbTable.grantReadData(gpPartialUpdatePatientRecordLambda);
    props.patientDbTable.grantReadData(gpPartialUpdatePatientRecordLambda);
    this.gpUpdateSchedulerSqs.mainQueue.grantConsumeMessages(
      gpPartialUpdatePatientRecordLambda
    );
    const emisPrivateKey = Secret.fromSecretNameV2(
      this,
      'emis-private-key',
      props.envVariables.emis.privateKeySecretName
    );
    emisPrivateKey.grantRead(gpPartialUpdatePatientRecordLambda);

    const emisPublicCert = Secret.fromSecretNameV2(
      this,
      'emis-public-cert',
      props.envVariables.emis.publicCertSecretName
    );
    emisPublicCert.grantRead(gpPartialUpdatePatientRecordLambda);

    gpPartialUpdatePatientRecordLambda.addEventSource(
      new SqsEventSource(this.gpUpdateSchedulerSqs.mainQueue, {
        reportBatchItemFailures: true,
        batchSize: 1
      })
    );
  }
}
