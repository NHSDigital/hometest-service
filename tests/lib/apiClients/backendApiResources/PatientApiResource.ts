import { type APIResponse } from '@playwright/test';
import { BackendBaseApiResource } from './BackendBaseApiResource';

export interface IPatientInfoResponse {
  termsAccepted: boolean;
  firstName: string;
  lastName: string;
}

export class PatientApiResource extends BackendBaseApiResource {
  public async getPatientInfo(): Promise<APIResponse> {
    return await this.backendApiResource.getRequest('/patient');
  }

  public async updatePatientInfo(termsAccepted: boolean): Promise<APIResponse> {
    return await this.backendApiResource.postRequest('/patient', {
      termsAccepted: termsAccepted
    });
  }
}
