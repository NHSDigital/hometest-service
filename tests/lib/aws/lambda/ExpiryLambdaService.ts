import { type InvokeCommandOutput } from '@aws-sdk/client-lambda';
import { LambdaService } from './LambdaService';

export class ExpiryLambdaService extends LambdaService {
  LambdaName: string;

  constructor(envName: string) {
    super(envName);
    this.LambdaName = `${envName}NhcDataExpiryLambda`;
  }

  public async triggerLambda(): Promise<InvokeCommandOutput> {
    return await this.runLambdaWithParameters(this.LambdaName, {});
  }
}
