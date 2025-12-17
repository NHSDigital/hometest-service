import {
  GetSecretValueCommand,
  SecretsManagerClient
} from '@aws-sdk/client-secrets-manager';

export class SecretManagerService {
  readonly client: SecretsManagerClient;
  constructor() {
    this.client = new SecretsManagerClient({ region: 'eu-west-2' });
  }

  public async getSecretValue(name: string): Promise<string> {
    try {
      console.log('about to fetch secret from secret manager', { name });

      const input = {
        SecretId: name
      };
      const command = new GetSecretValueCommand(input);
      const response = await this.client.send(command);

      if (response.SecretString != null) {
        console.log('secret fetched successfully', { name });
        return response.SecretString;
      } else {
        throw new Error('secret value could not be retrieved');
      }
    } catch (error) {
      console.log('secret could not be fetched', { error });
      throw error;
    }
  }
}
