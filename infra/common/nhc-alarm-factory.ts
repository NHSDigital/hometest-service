import type { Construct } from 'constructs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { SnsAction } from 'aws-cdk-lib/aws-cloudwatch-actions';
import { type ITopic, Topic } from 'aws-cdk-lib/aws-sns';
import { Fn } from 'aws-cdk-lib';
import type { NhcTopic } from './lib/enums';

export interface NhsAlarmFactoryOptions {
  alarmsEnabled: boolean;
  nhcTopic: NhcTopic;
}

export class AlertTopic {
  private static readonly topics = new Map<string, ITopic>();
  private constructor() {}

  static getTopic(scope: Construct, nhcTopic: NhcTopic): ITopic {
    if (!this.topics.has(nhcTopic)) {
      const topicArn = Fn.importValue(nhcTopic);
      const topic = Topic.fromTopicArn(scope, 'alert-topic', topicArn);
      this.topics.set(nhcTopic, topic);
    }
    return this.topics.get(nhcTopic)!;
  }
}

export class NhsAlarmFactory {
  options: NhsAlarmFactoryOptions;

  constructor(options: NhsAlarmFactoryOptions) {
    this.options = options;
  }

  public create(
    scope: Construct,
    id: string,
    props: cloudwatch.AlarmProps
  ): cloudwatch.Alarm | null {
    if (this.options.alarmsEnabled) {
      const alarm = new cloudwatch.Alarm(scope, id, props);
      const topic = AlertTopic.getTopic(scope, this.options.nhcTopic);
      const alarmAction = new SnsAction(topic);
      alarm.addAlarmAction(alarmAction);

      return alarm;
    }

    return null;
  }
}
