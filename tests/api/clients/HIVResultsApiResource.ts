import { APIRequestContext, APIResponse } from '@playwright/test';
import { BaseApiClient } from './BaseApiClient';
import { API_ENDPOINTS } from '../endpoints';
import { headersTestResults } from '../../test-data/HeadersTestResults';
import { createGetResultParams, createGetResultHeaders } from '../../test-data/GetResultRequestParams';
import { ResultsObservationData } from '../../test-data/ResultsObservationData';

export class HIVResultsApiResource extends BaseApiClient {
  constructor(request: APIRequestContext) {
    super(request);
  }

  async submitTestResults(testData: ResultsObservationData, headers: headersTestResults): Promise<APIResponse> {
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
