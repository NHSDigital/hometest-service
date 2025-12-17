import { type InvokeCommandOutput } from '@aws-sdk/client-lambda';
import { LambdaService } from './LambdaService';
import { NotificationTemplate } from '@dnhc-health-checks/shared/model/enum/notify-routing-plan';

export class NhcIdentifyNudgesLambdaService extends LambdaService {
  LambdaName: string;

  constructor(envName: string) {
    super(envName);
    this.LambdaName = `${envName}NhcIdentifyNudgesLambda`;
  }

  public async triggerLambda(
    notificationTemplate: NotificationTemplate = NotificationTemplate.NUDGE_INITIAL_AFTER_START
  ): Promise<InvokeCommandOutput> {
    return await this.runLambdaWithParameters(this.LambdaName, {
      template: notificationTemplate
    });
  }
}
