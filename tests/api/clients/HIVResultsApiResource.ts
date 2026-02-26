import { APIRequestContext, APIResponse } from '@playwright/test';
import { BaseApiClient } from './BaseApiClient';
import { API_ENDPOINTS } from '../endpoints';
import { HIVTestResult } from '../../test-data/HIVTestResultData';
import { headersTestResults } from '../../test-data/HeadersTestResults';
import { createGetResultParams, createGetResultHeaders } from '../../test-data/GetResultRequestParams';

export class HIVResultsApiResource extends BaseApiClient {
  constructor(request: APIRequestContext) {
    super(request);
  }

  async submitTestResults(testData: HIVTestResult, headers: typeof headersTestResults): Promise<APIResponse> {
    const endpoint = API_ENDPOINTS.results.base;
    const response = await this.post(endpoint, {
      headers: headers,
      data: testData,
    });

    return response;
  }

  validateResponse(response: APIResponse, expectedStatus: number = 200): void {
    this.validateStatus(response, expectedStatus);
  }

  async getResult(
  params: ReturnType<typeof createGetResultParams>,
  headers: ReturnType<typeof createGetResultHeaders>
): Promise<APIResponse> {
  const response = await this.get(API_ENDPOINTS.results.get, {
    params,
    headers,
  });
  return response;
}

}
