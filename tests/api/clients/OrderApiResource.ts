import { APIRequestContext, APIResponse } from '@playwright/test';
import { BaseApiClient } from './BaseApiClient';
import { API_ENDPOINTS } from '../endpoints';
import { OrderPayload } from '../../test-data/OrderTestData';
import { HeadersOrder } from '../../test-data/HeadersOrder';

export class OrderApiResource extends BaseApiClient {
  constructor(request: APIRequestContext) {
    super(request);
  }

  async createOrder(payload: OrderPayload, headers: HeadersOrder): Promise<APIResponse> {
    const response = await this.post(API_ENDPOINTS.order.create, {
      headers,
      data: payload,
    });

    return response;
  }

  validateResponse(response: APIResponse, expectedStatus: number = 201): void {
    this.validateStatus(response, expectedStatus);
  }
}
