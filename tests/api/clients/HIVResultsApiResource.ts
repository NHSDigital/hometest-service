import { APIResponse } from "@playwright/test";

import type { GetResultHeaders, GetResultParams } from "../../test-data/GetResultRequestParams";
import { ResultsStatusData } from "../../test-data/ResultStatusData";
import { HIVObservation } from "../../test-data/ResultsObservationData";
import type { ApiHeaders } from "../../utils";
import { API_ENDPOINTS } from "../Endpoints";
import { BaseApiClient } from "./BaseApiClient";

export class HIVResultsApiResource extends BaseApiClient {
  async submitTestResults(testData: HIVObservation, headers: ApiHeaders): Promise<APIResponse> {
    return this.post(API_ENDPOINTS.results.base, {
      headers,
      data: testData,
    });
  }

  async getResult(params: GetResultParams, headers: GetResultHeaders): Promise<APIResponse> {
    const response = await this.get(API_ENDPOINTS.results.get, {
      params,
      headers,
    });
    return response;
  }

  async updateResultStatus(testData: ResultsStatusData, headers: ApiHeaders): Promise<APIResponse> {
    return this.post(API_ENDPOINTS.results.status, {
      headers,
      data: testData,
    });
  }
}
