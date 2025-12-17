/* eslint-disable no-new */
import { type Construct } from 'constructs';
import { CfnOutput, type StackProps } from 'aws-cdk-lib';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { EmailSubscription } from 'aws-cdk-lib/aws-sns-subscriptions';
import { type NHCEnvVariables } from '../settings';
import { BaseStack } from '../../common/base-stack';

interface NhcMonitoringNotificationsStackProps extends StackProps {
  envVariables: NHCEnvVariables;
}

export class NhcMonitoringNotificationsDDOSAlertsStack extends BaseStack {
  public securityAlarmTopic: Topic;

  constructor(
    scope: Construct,
    id: string,
    props: NhcMonitoringNotificationsStackProps
  ) {
    super(scope, id, 'shared', props.envVariables.nhcVersion, 'us-east-1');

    const snsKmsKey = this.getKmsKey(
      this.account,
      props.envVariables.security.snsKmsKeyAliasName
    );

    this.securityAlarmTopic = new Topic(this, 'security-alarm-topic', {
      topicName: 'nhc-security-alarm-topic',
      masterKey: snsKmsKey
    });

    // Add an email subscription
    this.securityAlarmTopic.addSubscription(
      new EmailSubscription(props.envVariables.alarmSecurityEmail)
    );

    new CfnOutput(this, 'SecurityAlarmTopicArn', {
      value: this.securityAlarmTopic.topicArn,
      exportName: 'SecurityAlarmTopicArn'
    });
  }
}
