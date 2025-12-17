import {
  PutParameterCommand,
  type PutParameterCommandInput,
  SSMClient
} from '@aws-sdk/client-ssm';

export class ParameterStoreClient {
  private readonly client: SSMClient;

  constructor() {
    this.client = new SSMClient({
      region: 'eu-west-2'
    });
  }

  async setParameterValue(
    parameterName: string,
    parameterValue: string
  ): Promise<void> {
    const input: PutParameterCommandInput = {
      Name: `${parameterName}`,
      Value: parameterValue,
      Type: 'String',
      Overwrite: true
    };

    try {
      await this.client.send(new PutParameterCommand(input));
      console.log(`Parameter ${parameterName} updated successfully.`);
    } catch (error) {
      console.error(`Failed to update parameter ${parameterName}:`, error);
      throw error;
    }
  }
}
