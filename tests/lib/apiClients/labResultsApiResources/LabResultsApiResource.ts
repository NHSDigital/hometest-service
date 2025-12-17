import { type APIResponse } from '@playwright/test';
import { LabResultsApiClient } from '../LabResultsApiClient';
import type { IThrivaLabResults } from '@dnhc-health-checks/shared/model/thriva-lab-results';

export interface LabOrderSchema {
  id: string;
  testTypes: [LabTestType];
  deliveryAddress: IDeliveryAddress;
  healthCheckId: string;
  preferredContactMethod: string;
  fulfilmentOrderId?: string;
}

export interface IDeliveryAddress {
  addressLine1: string;
  addressLine2: string;
  townCity: string;
  postcode: string;
}

export enum LabTestType {
  Both = 'both',
  HbA1c = 'HbA1c',
  Cholesterol = 'Cholesterol'
}

export class LabResultsApiResource {
  protected readonly labResultsApiClient: LabResultsApiClient;

  constructor() {
    this.labResultsApiClient = new LabResultsApiClient();
  }

  public async sendLabResults(
    labResults: IThrivaLabResults
  ): Promise<APIResponse> {
    return await this.labResultsApiClient.postRequest('/results', labResults);
  }
}
