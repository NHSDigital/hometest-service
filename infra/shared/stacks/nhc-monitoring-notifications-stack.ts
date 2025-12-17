import { type Construct } from 'constructs';
import { CfnOutput, type StackProps } from 'aws-cdk-lib';
import { Topic } from 'aws-cdk-lib/aws-sns';
import {
  LoggingLevel,
  SlackChannelConfiguration
} from 'aws-cdk-lib/aws-chatbot';
import { type NHCEnvVariables } from '../settings';
import { BaseStack } from '../../common/base-stack';

interface NhcMonitoringNotificationsStackProps extends StackProps {
  envVariables: NHCEnvVariables;
}

export class NhcMonitoringNotificationsStack extends BaseStack {
  public alarmTopic: Topic;
  public gpOnboardingTopic: Topic;

  constructor(
    scope: Construct,
    id: string,
    props: NhcMonitoringNotificationsStackProps
  ) {
    super(scope, id, 'shared', props.envVariables.nhcVersion);

    const snsKmsKey = this.getKmsKey(
      this.account,
      props.envVariables.security.snsKmsKeyAliasName
    );

    this.alarmTopic = new Topic(this, 'alarm-topic', {
      topicName: 'nhc-alarm-topic',
      masterKey: snsKmsKey
    });

    const slackChannel = new SlackChannelConfiguration(this, 'slack-channel', {
      slackChannelConfigurationName: 'nhc-slack-channel-config',
      slackWorkspaceId: props.envVariables.slackChannelConfig.slackWorkspaceId,
      slackChannelId: props.envVariables.slackChannelConfig.slackChannelId,
      loggingLevel: LoggingLevel.INFO
    });

    slackChannel.addNotificationTopic(this.alarmTopic);

    this.gpOnboardingTopic = new Topic(this, 'gp-onboarding-topic', {
      topicName: 'nhc-gp-onboarding-topic',
      masterKey: snsKmsKey
    });

    const gpOnboardingSlackChannel = new SlackChannelConfiguration(
      this,
      'gp-onboarding-slack-channel',
      {
        slackChannelConfigurationName: 'nhc-gp-onboarding-slack-channel-config',
        slackWorkspaceId:
          props.envVariables.slackChannelConfig.slackWorkspaceId,
        slackChannelId:
          props.envVariables.slackChannelConfig.gpOnboardingSlackChannelId,
        loggingLevel: LoggingLevel.INFO
      }
    );
    gpOnboardingSlackChannel.addNotificationTopic(this.gpOnboardingTopic);

    new CfnOutput(this, 'AlarmTopicArn', {
      value: this.alarmTopic.topicArn,
      exportName: 'AlarmTopicArn'
    });

    new CfnOutput(this, 'GpOnboardingTopicArn', {
      value: this.gpOnboardingTopic.topicArn,
      exportName: 'GpOnboardingTopicArn'
    });
  }
}
