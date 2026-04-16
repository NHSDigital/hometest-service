import { APIRequestContext, APIResponse } from "@playwright/test";

import { OrderStatusTaskPayload } from "../../test-data/OrderStatusTypes";
import { API_ENDPOINTS } from "../Endpoints";
import { BaseApiClient } from "./BaseApiClient";

export class OrderStatusApiResource extends BaseApiClient {
  constructor(request: APIRequestContext) {
    super(request);
  }

  async updateOrderStatus(
    payload: OrderStatusTaskPayload,
    headers: Record<string, string>,
  ): Promise<APIResponse> {
    const response = await this.post(API_ENDPOINTS.orderStatus.update, {
      headers,
      data: payload,
    });

    return response;
  }

  validateResponse(response: APIResponse, expectedStatus: number = 201): void {
    this.validateStatus(response, expectedStatus);
  }
}
