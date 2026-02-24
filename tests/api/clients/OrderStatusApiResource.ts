import { APIRequestContext, APIResponse } from '@playwright/test';
import { BaseApiClient } from './BaseApiClient';
import { API_ENDPOINTS } from '../endpoints';

export interface OrderStatusTaskPayload {
  resourceType: 'Task';
  status: string;
  intent: string;
  basedOn: Array<{ reference: string }>;
  for: { reference: string };
  businessStatus?: { text: string };
  lastModified?: string;
}

export class OrderStatusApiResource extends BaseApiClient {
  constructor(request: APIRequestContext) {
    super(request);
  }

  async updateOrderStatus(
    payload: OrderStatusTaskPayload,
    headers: Record<string, string>,
  ): Promise<APIResponse> {
    const response = await this.put(API_ENDPOINTS.orderStatus.update, {
      headers,
      data: payload,
    });

    return response;
  }

  validateResponse(response: APIResponse, expectedStatus: number = 200): void {
    this.validateStatus(response, expectedStatus);
  }
}
