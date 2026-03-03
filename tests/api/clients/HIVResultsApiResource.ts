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
      data: testData,
    });
  }

  async getResult(
    params: GetResultParams,
    headers: GetResultHeaders,
  ): Promise<APIResponse> {
    const response = await this.get(API_ENDPOINTS.results.get, {
      params,
      headers,
    });
    return response;
  }
}
