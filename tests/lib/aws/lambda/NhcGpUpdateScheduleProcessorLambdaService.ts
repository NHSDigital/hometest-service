import { type InvokeCommandOutput } from '@aws-sdk/client-lambda';
import { LambdaService } from './LambdaService';

export class NhcGpUpdateScheduleProcessorLambdaService extends LambdaService {
  LambdaName: string;

  constructor(envName: string) {
    super(envName);
    this.LambdaName = `${envName}NhcGpUpdateScheduleProcessorLambda`;
  }

  public async triggerLambda(): Promise<InvokeCommandOutput> {
    return await this.runLambdaWithParameters(this.LambdaName, {});
  }
}
