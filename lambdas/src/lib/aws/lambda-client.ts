import { type Commons } from '../commons';
import {
  InvokeCommand,
  type InvokeCommandInput,
  type InvokeCommandOutput,
  type LambdaClient
} from '@aws-sdk/client-lambda';
import { AWSService } from '../aws-service';

export class LambdaClientService extends AWSService<LambdaClient> {
  constructor(commons: Commons, lambdaClient: LambdaClient) {
    super(commons, 'LambdaClientService', lambdaClient);
  }

  async invokeLambda(
    functionName: string,
    payload: Record<any, any>
  ): Promise<InvokeCommandOutput> {
    try {
      this.logger.info('about to invoke lambda', { functionName });
      const invokeParams: InvokeCommandInput = {
        FunctionName: functionName,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify(payload)
      };
      const response: InvokeCommandOutput = await this.client.send(
        new InvokeCommand(invokeParams)
      );
      return response;
    } catch (error) {
      this.logger.error('error occurred while invoking lambda', { error });
      throw error;
    }
  }
}
