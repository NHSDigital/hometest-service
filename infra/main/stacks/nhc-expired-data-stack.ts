import { type Construct } from 'constructs';
import { BaseStack } from '../../common/base-stack';
import { type ITable } from 'aws-cdk-lib/aws-dynamodb';
import { Duration, type StackProps } from 'aws-cdk-lib';
import { type NHCEnvVariables } from '../settings';
import { type Queue } from 'aws-cdk-lib/aws-sqs';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { NhcLambdaFactory } from '../../common/nhc-lambda-factory';
import { type NhsAlarmFactory } from '../../common/nhc-alarm-factory';

interface NhcExpiredDataStackProps extends StackProps {
  healthCheckTable: ITable;
  labResultTable: ITable;
  orderTable: ITable;
  patientTable: ITable;
  gpUpdateSchedulerTable: ITable;
  auditEventsQueue: Queue;
  envVariables: NHCEnvVariables;
  alarmFactory: NhsAlarmFactory;
  communicationQueue: Queue;
}

export class NhcExpiredDataStack extends BaseStack {
  constructor(scope: Construct, id: string, props: NhcExpiredDataStackProps) {
    super(
      scope,
      id,
      props.envVariables.common.envName,
      props.envVariables.nhcVersion
    );

    const lambdaFactory = new NhcLambdaFactory(
      this,
      this.stackBaseName,
      props.envVariables,
      props.alarmFactory,
      props.envVariables.tracingEnabled,
      props.envVariables.amazonInspectorEnabled
    );

    if (props.envVariables.enableAutoExpiry) {
      const dataExpiryLambda = lambdaFactory.createLambda({
        name: 'data-expiry-lambda',
        additionalProps: {
          timeout: Duration.minutes(15),
          reservedConcurrentExecutions: 1
        },
        environment: {
          EVENTS_QUEUE_URL: props.auditEventsQueue.queueUrl,
          AUTO_EXPIRE_AFTER_DAYS: props.envVariables.autoExpireAfterDays,
          NO_LAB_RESULT_AUTO_WRITEBACK_AFTER_DAYS:
            props.envVariables.noLabResultAutoWritebackAfterDays,
          NO_LAB_RESULT_AUTO_EXPIRE_AFTER_DAYS:
            props.envVariables.noLabResultAutoExpireAfterDays,
          NO_LAB_RESULT_FINAL_AUTO_EXPIRE_AFTER_DAYS:
            props.envVariables.noLabResultFinalAutoExpireAfterDays,
          COMMUNICATION_QUEUE_URL: props.communicationQueue.queueUrl
        },
        alarmConfig: {
          createLambdaErrorAlarm: true,
          createLambdaDurationAlarm: true,
          durationAlarmThreshold: Duration.minutes(10),
          createLambdaNotInvokedAlarm: true,
          createLambdaNotInvokedAlarmPeriod: Duration.hours(3)
        }
      });

      props.communicationQueue.grantSendMessages(dataExpiryLambda);
      props.healthCheckTable.grantReadWriteData(dataExpiryLambda);
      props.labResultTable.grantReadWriteData(dataExpiryLambda);
      props.orderTable.grantReadWriteData(dataExpiryLambda);
      props.patientTable.grantReadData(dataExpiryLambda);
      props.gpUpdateSchedulerTable.grantWriteData(dataExpiryLambda);
      props.auditEventsQueue.grantSendMessages(dataExpiryLambda);

      new Rule(this, 'data-expiry-rule', {
        schedule: Schedule.rate(Duration.hours(1)),
        targets: [new LambdaFunction(dataExpiryLambda)]
      });
    }
  }
}
