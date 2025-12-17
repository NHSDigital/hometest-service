import { request, type APIResponse } from '@playwright/test';
import { CognitoApiClient } from './CognitoApiClient';
import { type Config, ConfigFactory } from '../../env/config';
import { defaultUserAgent } from '../../playwright.config';
import type { IThrivaLabResults } from '@dnhc-health-checks/shared/model/thriva-lab-results';

export class LabResultsApiClient {
  private readonly config: Config;
  private readonly baseUrl: string;
  private readonly cognitoApiClient: CognitoApiClient;

  constructor() {
    this.config = ConfigFactory.getConfig();
    this.baseUrl = this.config.labResultsAPI;
    this.cognitoApiClient = new CognitoApiClient();
  }

  public async postRequest(
    resource: string,
    data?: IThrivaLabResults
  ): Promise<APIResponse> {
    const requestContext = await request.newContext({
      baseURL: this.baseUrl,
      userAgent: defaultUserAgent
    });
    return await requestContext.post(resource, {
      data,
      headers: {
        Authorization: `Bearer ${await this.cognitoApiClient.getCognitoToken()}`
      }
    });
  }
}
