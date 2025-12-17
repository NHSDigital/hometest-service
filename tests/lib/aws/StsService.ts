import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts';

export class StsService {
  readonly client: STSClient;
  constructor() {
    this.client = new STSClient({ region: 'eu-west-2' });
  }

  public async getAccountId(): Promise<string | undefined> {
    const input = {};
    const command = new GetCallerIdentityCommand(input);
    const response = await this.client.send(command);

    return response.Account;
  }
}
