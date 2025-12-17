import type { APIResponse } from '@playwright/test';
import { MtlsResultsApiClient } from '../MtlsResultsApiClient';
import type { IThrivaLabResults } from '@dnhc-health-checks/shared/model/thriva-lab-results';

export class MtlsResultsApiResource {
  private readonly mtlsResultsApiClient: MtlsResultsApiClient;

  constructor() {
    this.mtlsResultsApiClient = new MtlsResultsApiClient();
  }

  public async sendLabResults(data?: IThrivaLabResults): Promise<APIResponse> {
    return this.mtlsResultsApiClient.postRequest('/results', data);
  }
}
