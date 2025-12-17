import { request, type APIResponse } from '@playwright/test';
import { ConfigFactory } from '../../env/config';
import { defaultUserAgent } from '../../playwright.config';
import { getApimProxyAuth, type ApimAuthHeaders } from '../ApimProxyAuthHelper';

export class ApimProxyApiClient {
  private readonly baseUrl: string;

  constructor() {
    const config = ConfigFactory.getConfig();
    this.baseUrl = config.apimProxyApiUrl;
  }

  private async getAuthHeaders(): Promise<ApimAuthHeaders> {
    const auth = await getApimProxyAuth();
    return {
      Authorization: `Bearer ${auth.accessToken}`,
      'X-Correlation-ID': auth.correlationId,
      'X-Message-Reference': auth.messageReference,
      'X-Message-Batch-Reference': auth.messageBatchReference
    };
  }

  private async post(
    resource: string,
    data: unknown,
    headers: Record<string, string>
  ): Promise<APIResponse> {
    const requestContext = await request.newContext({
      baseURL: this.baseUrl,
      userAgent: defaultUserAgent
    });
    return requestContext.post(resource, {
      data,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...headers
      }
    });
  }

  public async postRequest(
    resource: string,
    data: unknown
  ): Promise<APIResponse> {
    const authHeaders = await this.getAuthHeaders();
    return this.post(resource, data, { ...authHeaders });
  }

  public async postRequestWithoutToken(
    resource: string,
    data: unknown
  ): Promise<APIResponse> {
    return this.post(resource, data, {});
  }
}
