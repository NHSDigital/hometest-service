/* eslint-disable no-new */
import { Construct } from 'constructs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Duration } from 'aws-cdk-lib';
import { ResourceNamingService } from '../../common/resource-naming-service';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { type IKey } from 'aws-cdk-lib/aws-kms';
import { type NhsAlarmFactory } from '../../common/nhc-alarm-factory';

export interface NhcSqsQueueProps {
  scope: Construct;
  id: string;
  kmsKey: IKey;
  maxReceiveCount: number;
  isFifo?: true | undefined; // fifo can't be set to false: https://github.com/aws-cloudformation/cloudformation-coverage-roadmap/issues/165
  additionalProperties?: Partial<sqs.QueueProps>;
  alarmFactory: NhsAlarmFactory;
}

export class NhcSqsQueue extends Construct {
  public readonly mainQueue: sqs.Queue;
  public readonly dlQueue: sqs.Queue;
  public readonly queueName: string;

  constructor(props: NhcSqsQueueProps) {
    const { scope, id } = props;
    super(scope, id);

    const envName = process.env.HEALTH_CHECK_ENVIRONMENT ?? 'dev';
    const namingService = new ResourceNamingService(envName);
    const fifoName = (name: string): string => {
      return `${name}.fifo`;
    };

    const dlqName = `${id}-dlq`;
    this.dlQueue = new sqs.Queue(this, dlqName, {
      retentionPeriod: Duration.days(14),
      visibilityTimeout: Duration.minutes(5),
      queueName: namingService.getEnvSpecificResourceName(
        props.isFifo === true ? fifoName(dlqName) : dlqName
      ),
      fifo: props.isFifo,
      encryption: sqs.QueueEncryption.KMS,
      encryptionMasterKey: props.kmsKey
    });
    this.queueName = namingService.getEnvSpecificResourceName(
      props.isFifo === true ? fifoName(id) : id
    );
    this.mainQueue = new sqs.Queue(this, id, {
      queueName: this.queueName,
      deadLetterQueue: {
        queue: this.dlQueue,
        maxReceiveCount: props.maxReceiveCount
      },
      fifo: props.isFifo,
      encryption: sqs.QueueEncryption.KMS,
      encryptionMasterKey: props.kmsKey,
      ...props.additionalProperties
    });

    const numberOfMessagesMetric = new cloudwatch.Metric({
      namespace: 'AWS/SQS',
      metricName: 'ApproximateNumberOfMessagesVisible',
      dimensionsMap: {
        QueueName: this.dlQueue.queueName
      },
      statistic: cloudwatch.Stats.MAXIMUM,
      period: Duration.minutes(5)
    });

    const messageOnDlqAlarmName = `message-on-${dlqName}`;
    props.alarmFactory.create(this, messageOnDlqAlarmName, {
      metric: numberOfMessagesMetric,
      threshold: 1,
      evaluationPeriods: 3,
      datapointsToAlarm: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Alarm triggered when a message arrives on a DLQ',
      alarmName: namingService.getEnvSpecificResourceName(messageOnDlqAlarmName)
    });
  }
}
