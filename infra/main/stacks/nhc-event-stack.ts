import { type Construct } from 'constructs';
import { BaseStack } from '../../common/base-stack';
import { type ITable } from 'aws-cdk-lib/aws-dynamodb';
import { type StackProps } from 'aws-cdk-lib';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { NhcSqsQueue } from '../resources/nhc-sqs-queue';
import { type NHCEnvVariables } from '../settings';
import { NhcLambdaFactory } from '../../common/nhc-lambda-factory';
import { type SqsRedriveSubscribeService } from './nhc-monitoring-stack';
import { type IKey } from 'aws-cdk-lib/aws-kms';
import { type NhsAlarmFactory } from '../../common/nhc-alarm-factory';

interface NhcEventsStackProps extends StackProps {
  auditEventTable: ITable;
  patientTable: ITable;
  envVariables: NHCEnvVariables;
  sqsRedrive: SqsRedriveSubscribeService;
  alarmFactory: NhsAlarmFactory;
}

export class NhcEventsStack extends BaseStack {
  readonly kmsKey: IKey;
  public readonly auditEventsQueue: NhcSqsQueue;

  constructor(scope: Construct, id: string, props: NhcEventsStackProps) {
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

    const createAuditEventLambda = lambdaFactory.createLambda({
      name: 'event-create-lambda',
      alarmConfig: { createLambdaErrorAlarm: false }
    });
    props.auditEventTable.grantWriteData(createAuditEventLambda);
    props.patientTable.grantReadData(createAuditEventLambda);

    this.auditEventsQueue = new NhcSqsQueue({
      scope: this,
      id: 'audit-events',
      kmsKey: this.kmsKey,
      maxReceiveCount: +props.envVariables.sqsMaxReceiveCount,
      alarmFactory: props.alarmFactory
    });
    props.sqsRedrive.subscribe(this.auditEventsQueue);
    this.auditEventsQueue.mainQueue.grantConsumeMessages(
      createAuditEventLambda
    );

    createAuditEventLambda.addEventSource(
      new SqsEventSource(this.auditEventsQueue.mainQueue, {
        reportBatchItemFailures: true
      })
    );
  }
}
