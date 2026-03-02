import { APIResponse } from '@playwright/test';
import { BaseApiClient } from './BaseApiClient';
import { API_ENDPOINTS } from '../Endpoints';
import { HIVTestResult } from '../../test-data/HIVTestResultData';
<<<<<<< HEAD
import { ApiHeaders } from '../../utils/ApiRequestHelper';
import {
  GetResultHeaders,
  GetResultParams,
} from "../../test-data/GetResultRequestParams";

import { APIResponse } from "@playwright/test";
import { API_ENDPOINTS } from "../Endpoints";
import { ApiHeaders } from "../../utils/ApiRequestHelper";
import { BaseApiClient } from "./BaseApiClient";
import { HIVTestResult } from "../../test-data/HIVTestResultData";

export class HIVResultsApiResource extends BaseApiClient {
  async submitTestResults(
    testData: HIVTestResult,
    headers: ApiHeaders,
  ): Promise<APIResponse> {
    return this.post(API_ENDPOINTS.results.base, {
      headers,
=======
import { headersTestResults } from '../../test-data/HeadersTestResults';
import { createGetResultParams, createGetResultHeaders } from '../../test-data/GetResultRequestParams';
import { ResultsObservationData } from '../../test-data/ResultsObservationData';

export class HIVResultsApiResource extends BaseApiClient {
  constructor(request: APIRequestContext) {
    super(request);
  }

  async submitTestResults(testData: HIVTestResult | ResultsObservationData, headers: headersTestResults): Promise<APIResponse> {
    const endpoint = API_ENDPOINTS.results.base;
    const response = await this.post(endpoint, {
      headers: headers,
>>>>>>> 05c18311 (local changes before pull)
      data: testData,
    });
  }

  async getResult(
<<<<<<< HEAD
    params: GetResultParams,
    headers: GetResultHeaders,
  ): Promise<APIResponse> {
    const response = await this.get(API_ENDPOINTS.results.get, {
      params,
      headers,
    });
    return response;
  }
=======
  params: ReturnType<typeof createGetResultParams>,
  headers: ReturnType<typeof createGetResultHeaders>
): Promise<APIResponse> {
  const response = await this.get(API_ENDPOINTS.results.get, {
    params,
    headers,
  });
  return response;
}
>>>>>>> 05c18311 (local changes before pull)
}
