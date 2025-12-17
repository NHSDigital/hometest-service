import type { APIResponse } from '@playwright/test';
import type { IThrivaLabResults } from '@dnhc-health-checks/shared/model/thriva-lab-results';
import { ApimProxyApiClient } from '../ApimProxyApiClient';

export class ApimProxyApiResource {
  private readonly apimProxyApiClient: ApimProxyApiClient;
  private readonly labResultsPath = '/home-testing/results';

  constructor() {
    this.apimProxyApiClient = new ApimProxyApiClient();
  }

  public async sendLabResults(data: IThrivaLabResults): Promise<APIResponse> {
    return this.apimProxyApiClient.postRequest(this.labResultsPath, data);
  }

  public async sendLabResultsWithoutJWT(data: IThrivaLabResults): Promise<APIResponse> {
    return this.apimProxyApiClient.postRequestWithoutToken(this.labResultsPath, data);
  }
}
