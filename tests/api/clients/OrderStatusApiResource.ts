import { APIRequestContext, APIResponse } from "@playwright/test";
import { BaseApiClient } from "./BaseApiClient";
import { API_ENDPOINTS } from "../Endpoints";
import { OrderStatusTaskPayload } from "../../test-data/OrderStatusTypes";

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

  validateResponse(response: APIResponse, expectedStatus: number = 200): void {
    this.validateStatus(response, expectedStatus);
  }
}
