import { type APIResponse, request } from '@playwright/test';
import { type Config, ConfigFactory } from '../../env/config';
import { SecretManagerService } from '../aws/SecretManagerService';
import * as crypto from 'crypto';
import type { NotifyCallbackPayloadSchema } from './notifyCallbackResources/NotifyCallbackApiResources';

export class NotifyCallbackApiClient {
  private readonly config: Config;
  private readonly notifyCallbackUrl: string;
  private readonly secretManagerService: SecretManagerService;

  constructor() {
    this.config = ConfigFactory.getConfig();
    this.notifyCallbackUrl = this.config.notifyCallbackUrl;
    this.secretManagerService = new SecretManagerService();
  }

  private getDefaultSecretKeyName(): string {
    switch (this.config.name) {
      case 'test':
        return 'test-1';
      case 'int':
        return 'int-1';
      default:
        return 'dev-1';
    }
  }

  private async getXApiKey(): Promise<Record<string, string>> {
    let apiKeyPath;
    switch (this.config.name) {
      case 'test':
        apiKeyPath = 'nhc/test/notify-callbacks-api-key';
        break;
      case 'int':
        apiKeyPath = 'nhc/int/notify-callbacks-api-key';
        break;
      default:
        apiKeyPath = 'nhc/dev/notify-callback-api-key';
        break;
    }

    return JSON.parse(
      await this.secretManagerService.getSecretValue(apiKeyPath)
    ) as Record<string, string>;
  }

  private async getApplicationId(): Promise<string> {
    let applicationIdPath;
    switch (this.config.name) {
      case 'test':
        applicationIdPath = 'nhc/test/nhs-api-platform-application-id';
        break;
      case 'int':
        applicationIdPath = 'nhc/int/nhs-api-platform-application-id';
        break;
      default:
        applicationIdPath = 'nhc/dev/nhs-api-platform-application-id';
        break;
    }
    return await this.secretManagerService.getSecretValue(applicationIdPath);
  }

  public async getApiKeyValue(
    secretKeyName: string = this.getDefaultSecretKeyName()
  ): Promise<string> {
    const xApiKey = await this.getXApiKey();
    return xApiKey[secretKeyName];
  }

  public async postRequest(
    resource: string,
    data: NotifyCallbackPayloadSchema,
    apiKey?: string,
    header?: { [key: string]: string }
  ): Promise<APIResponse> {
    const apiKeyValue = apiKey ?? (await this.getApiKeyValue());
    const applicationIdKey = await this.getApplicationId();

    const requestContext = await request.newContext({
      baseURL: this.notifyCallbackUrl
    });

    const signatureValue = crypto
      .createHmac('sha256', `${applicationIdKey}.${apiKeyValue}`)
      .update(JSON.stringify(data), 'utf8')
      .digest('hex');

    return await requestContext.post(resource, {
      data,
      headers: header ?? {
        'x-api-key': apiKeyValue,
        'x-hmac-sha256-signature': signatureValue
      }
    });
  }
}
