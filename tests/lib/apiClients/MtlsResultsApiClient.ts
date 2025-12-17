import { request, type APIResponse } from '@playwright/test';
import { ConfigFactory, type Config } from '../../env/config';
import { defaultUserAgent } from '../../playwright.config';
import type { IThrivaLabResults } from '@dnhc-health-checks/shared/model/thriva-lab-results';

export class MtlsResultsApiClient {
  private readonly config: Config;
  private readonly baseUrl: string;

  constructor() {
    this.config = ConfigFactory.getConfig();
    this.baseUrl = this.config.mtlsResultsApiUrl;
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
      data
    });
  }
}
