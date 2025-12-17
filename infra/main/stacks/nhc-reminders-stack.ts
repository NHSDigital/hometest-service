import { type StackProps } from 'aws-cdk-lib';
import type * as sqs from 'aws-cdk-lib/aws-sqs';
import { type Construct } from 'constructs';
import { BaseStack } from '../../common/base-stack';
import { type ITable } from 'aws-cdk-lib/aws-dynamodb';
import { type NHCEnvVariables } from '../settings';
import { NhcLambdaFactory } from '../../common/nhc-lambda-factory';
import { type NhsAlarmFactory } from '../../common/nhc-alarm-factory';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { CfnSchedule } from 'aws-cdk-lib/aws-scheduler';

interface NhcRemindersStackProps extends StackProps {
  healthCheckTable: ITable;
  patientTable: ITable;
  communicationQueue: sqs.Queue;
  envVariables: NHCEnvVariables;
  alarmFactory: NhsAlarmFactory;
}

export class NhcRemindersStack extends BaseStack {
  constructor(scope: Construct, id: string, props: NhcRemindersStackProps) {
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

    const identifyNudgesLambda = lambdaFactory.createLambda({
      name: 'identify-nudges-lambda',
      environment: {
        COMMUNICATION_QUEUE_URL: props.communicationQueue.queueUrl,
        NUDGE_INITIAL_AFTER_START_CRITERIA_NUMBER_OF_DAYS:
          props.envVariables.nudges.nudgeInitialAfterStartNumberOfDays.toString(),
        AUTO_EXPIRE_AFTER_DAYS: props.envVariables.autoExpireAfterDays
      }
    });
    props.communicationQueue.grantSendMessages(identifyNudgesLambda);
    props.healthCheckTable.grantReadWriteData(identifyNudgesLambda);
    props.patientTable.grantReadData(identifyNudgesLambda);

    const role = new Role(this, 'schedule-role', {
      managedPolicies: [
        ManagedPolicy.fromManagedPolicyArn(
          this,
          'aws-lambda-role-policy',
          'arn:aws:iam::aws:policy/service-role/AWSLambdaRole'
        )
      ],
      assumedBy: new ServicePrincipal('scheduler.amazonaws.com')
    });

    if (props.envVariables.enableNudges) {
      props.envVariables.nudges.config.forEach((nudge, index) => {
        new CfnSchedule(
          this,
          `identify-nudges-init-after-start-schedule-${index}`,
          {
            flexibleTimeWindow: {
              mode: 'OFF'
            },
            scheduleExpression: nudge.schedule,
            scheduleExpressionTimezone: 'Europe/London',
            target: {
              arn: identifyNudgesLambda.functionArn,
              roleArn: role.roleArn,
              input: JSON.stringify({
                template: nudge.template
              })
            }
          }
        );
      });
    }
  }
}
