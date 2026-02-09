import { APIRequestContext, APIResponse } from '@playwright/test';
import { BaseApiClient } from './BaseApiClient';
import { API_ENDPOINTS } from '../endpoints';
import { HIVTestResult, HIVTestResultData } from '../../test-data/HIVTestResultData';
import { headersTestResults } from '../../test-data/HeadersTestResults';

export class HIVResultsApiResource extends BaseApiClient {
  constructor(request: APIRequestContext) {
    super(request);
  }

  async submitTestResults(testData: HIVTestResult, headers: typeof headersTestResults): Promise<HIVTestResult> {
    const endpoint = API_ENDPOINTS.results.base;
    const response = await this.post(endpoint, {
      headers: headers,
      data: testData,
    });

    this.validateStatus(response, 201);

    return await this.parseJsonResponse<HIVTestResult>(response);
  }

}
