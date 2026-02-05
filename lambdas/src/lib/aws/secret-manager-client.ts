import {
  GetSecretValueCommand,
  PutSecretValueCommand,
  type SecretsManagerClient
} from '@aws-sdk/client-secrets-manager';
import { AWSService } from '../aws-service';

interface ISecretManagerClient {
  getSecretValue: (name: string) => Promise<string>;
}

export class SecretManagerClient
  extends AWSService<SecretsManagerClient>
  implements ISecretManagerClient
{
  // ALPHA: Removed commons temporarily.
  constructor(client: SecretsManagerClient) {
    super('SecretManagerClient', client);
  }

  public async getSecretValue(name: string): Promise<string> {
    try {
      const input = {
        SecretId: name
      };
      const command = new GetSecretValueCommand(input);
      const response = await this.client.send(command);

      if (response.SecretString == null) {
        throw new Error('secret value could not be retrieved');
      } else {
        return response.SecretString;
      }
    } catch (error) {
      throw new Error(`Failed to get secret value for ${name}: ${error}`);
    }
  }

  public async getSecretKeyValuePair(name: string): Promise<any> {
    return JSON.parse(await this.getSecretValue(name));
  }

  public async updateSecretKeyValuePair(
    secretName: string,
    keyToUpdate: string,
    newValue: string
  ): Promise<void> {
    const secretObject = await this.getSecretKeyValuePair(secretName);
    secretObject[keyToUpdate] = newValue;

    const putCommand = new PutSecretValueCommand({
      SecretId: secretName,
      SecretString: JSON.stringify(secretObject)
    });

    await this.client.send(putCommand);
  }
}
