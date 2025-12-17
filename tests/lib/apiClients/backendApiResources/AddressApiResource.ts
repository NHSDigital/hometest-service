import { type APIResponse } from '@playwright/test';
import { BackendBaseApiResource } from './BackendBaseApiResource';
import type { DeliverAddress } from '../HealthCheckModel';

export interface IAddressLookupResponse {
  allAddressesNumber: number;
  addressList: DeliverAddress[];
}
export class AddressApiResource extends BackendBaseApiResource {
  public async getAddressesByPostcode(postcode: string): Promise<APIResponse> {
    return await this.backendApiResource.getRequest(
      `/address?postcode=${postcode}`
    );
  }
}
