import {
  type APIRequestContext,
  type APIResponse,
  request
} from '@playwright/test';
import { type Config, ConfigFactory } from '../../env/config';
import getAuthToken from './apiAuthorizer';
import { defaultUserAgent } from '../../playwright.config';

export class BackendApiClient {
  private readonly config: Config;
  private readonly baseUrl: string;

  constructor() {
    this.config = ConfigFactory.getConfig();
    this.baseUrl = this.config.backendApiURL;
  }

  public async getRequest(resource: string): Promise<APIResponse> {
    const requestContext = await this.makeRequest();
    return await requestContext.get(resource, {
      headers: {
        Cookie: `auth=${getAuthToken()}`
      }
    });
  }

  public async getRequestWithInvalidToken(
    resource: string
  ): Promise<APIResponse> {
    const requestContext = await this.makeRequest();
    return await requestContext.get(resource, {
      headers: {
        Cookie: 'auth=invalid-token'
      }
    });
  }

  public async postRequest(
    resource: string,
    data?: Record<string, unknown>,
    headers?: Record<string, string>
  ): Promise<APIResponse> {
    const requestContext = await this.makeRequest();
    return await requestContext.post(resource, {
      data,
      headers: headers ?? {
        Cookie: `auth=${getAuthToken()}`
      }
    });
  }

  public async postRequestWithInvalidToken(
    resource: string,
    data?: Record<string, unknown>
  ): Promise<APIResponse> {
    const requestContext = await this.makeRequest();
    return await requestContext.post(resource, {
      data,
      headers: {
        Cookie: 'auth=invalid-token'
      }
    });
  }

  protected async makeRequest(): Promise<APIRequestContext> {
    return await request.newContext({
      baseURL: this.baseUrl,
      userAgent: defaultUserAgent
    });
  }
}
