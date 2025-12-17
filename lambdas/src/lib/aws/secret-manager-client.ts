import {
  GetSecretValueCommand,
  PutSecretValueCommand,
  type SecretsManagerClient
} from '@aws-sdk/client-secrets-manager';
import { type Commons } from '../commons';
import { AWSService } from '../aws-service';

interface ISecretManagerClient {
  getSecretValue: (name: string) => Promise<string>;
}

export class SecretManagerClient
  extends AWSService<SecretsManagerClient>
  implements ISecretManagerClient
{
  constructor(commons: Commons, client: SecretsManagerClient) {
    super(commons, 'SecretManagerClient', client);
  }

  public async getSecretValue(name: string): Promise<string> {
    try {
      this.logger.info('about to fetch secret from secret manager', { name });

      const input = {
        SecretId: name
      };
      const command = new GetSecretValueCommand(input);
      const response = await this.client.send(command);

      if (response.SecretString == null) {
        throw new Error('secret value could not be retrieved');
      } else {
        this.logger.debug('secret fetched successfully', { name });
        return response.SecretString;
      }
    } catch (error) {
      this.logger.error('secret could not be fetched', { error }, true);
      throw error;
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

    this.logger.info('updating secret value', {
      secretName
    });

    await this.client.send(putCommand);
  }
}
