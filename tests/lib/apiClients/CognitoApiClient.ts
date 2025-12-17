import { request } from '@playwright/test';
import { type Config, ConfigFactory } from '../../env/config';
import { defaultUserAgent } from '../../playwright.config';
import { SecretManagerService } from '../aws/SecretManagerService';

interface CognitoAuthResponseBody {
  access_token: string;
  scope: string;
  expires_in: number;
  token_type: string;
}

const SCOPES = 'results/write';

const requestBody = {
  grant_type: 'client_credentials',
  scope: SCOPES
};

export class CognitoApiClient {
  private readonly config: Config;
  private readonly baseUrl: string;
  private readonly secretManagerService: SecretManagerService;

  constructor() {
    this.config = ConfigFactory.getConfig();
    this.baseUrl = this.config.cognitoApiURL;
    this.secretManagerService = new SecretManagerService();
  }

  async getCredentials(): Promise<string> {
    const thrivaClientId = await this.secretManagerService.getSecretValue(
      `nhc/${this.config.name}/results-cognito-client-id`
    );
    const thrivaClientSecret = await this.secretManagerService.getSecretValue(
      `nhc/${this.config.name}/results-cognito-client-secret`
    );
    const credentials = Buffer.from(
      `${thrivaClientId}:${thrivaClientSecret}`
    ).toString('base64');

    return credentials;
  }

  async getCognitoToken(): Promise<string> {
    const response = await (
      await request.newContext({
        baseURL: this.baseUrl,
        userAgent: defaultUserAgent
      })
    ).post('/oauth2/token', {
      form: requestBody,
      headers: {
        Authorization: `Basic ${await this.getCredentials()}`
      }
    });

    const body = await response.body();
    const parsedBody = JSON.parse(body.toString()) as CognitoAuthResponseBody;
    const cognitoToken = parsedBody.access_token;

    return cognitoToken;
  }
}
