import { APIResponse, expect } from '@playwright/test';
import { BaseApiClient } from './BaseApiClient';
import { API_ENDPOINTS } from '../Endpoints';
import { OrderPayload } from '../../test-data/OrderTestData';
import type { ApiHeaders } from '../../utils';
import { OrderStatusCode } from '../../models/TestOrder';

export class OrderApiResource extends BaseApiClient {
  async createOrder(
    payload: OrderPayload,
    headers: ApiHeaders,
  ): Promise<APIResponse> {
    return this.post(API_ENDPOINTS.order.create, {
      headers,
      data: payload,
    });
  }

  async getOrder(
    nhsNumber: string,
    dateOfBirth: string,
    orderId: string,
  ): Promise<APIResponse> {
    return this.get(API_ENDPOINTS.order.get, {
      params: {
        nhs_number: nhsNumber,
        date_of_birth: dateOfBirth,
        order_id: orderId,
      },
    });
  }

  extractOrderStatus(responseBody: Record<string, unknown>): string {
    const body = responseBody as any;
    return body.entry[0].resource.extension[0].valueCodeableConcept.coding[0]
      .code;
  }

  async assertOrderHasStatus(
    nhsNumber: string,
    dob: string,
    orderId: string,
    expectedStatus: OrderStatusCode,
  ): Promise<void> {
    const response = await this.getOrder(nhsNumber, dob, orderId);
    this.validateStatus(response, 200);

    const body = await response.json();
    const actualStatus = this.extractOrderStatus(body);
    expect(actualStatus).toBe(expectedStatus);
  }
}
