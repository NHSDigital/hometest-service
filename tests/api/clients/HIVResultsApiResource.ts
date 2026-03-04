import { APIResponse } from "@playwright/test";
import { BaseApiClient } from "./BaseApiClient";
import { API_ENDPOINTS } from "../Endpoints";
import { ResultsObservationData } from "../../test-data/ResultsObservationData";
import { ApiHeaders } from "../../utils/ApiRequestHelper";
import { GetResultParams, GetResultHeaders } from "../../test-data/GetResultRequestParams";

export class HIVResultsApiResource extends BaseApiClient {
  async submitTestResults(
    testData: ResultsObservationData,
    headers: ApiHeaders,
  ): Promise<APIResponse> {
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
}
