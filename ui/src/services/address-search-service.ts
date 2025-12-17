import { backendApiEndpoint } from '../settings';
import { httpClient } from '../lib/http/http-client';
import { type Address } from '@dnhc-health-checks/shared';

export interface AddressSearchResponse {
  addressList: Address[];
  allAddressesNumber: number;
}

export interface IAddressSearchService {
  searchForAddress: (
    postcode: string,
    buildingNumber?: string
  ) => Promise<AddressSearchResponse>;
}

const addressSearchService: IAddressSearchService = {
  searchForAddress: async function (
    postcode: string,
    buildingNumber?: string
  ): Promise<AddressSearchResponse> {
    try {
      const buildingNumberQuery = buildingNumber
        ? `&buildingNumber=${encodeURIComponent(buildingNumber)}`
        : '';
      const response = await httpClient.getRequest<AddressSearchResponse>(
        `${backendApiEndpoint}/address?postcode=${encodeURIComponent(postcode)}${buildingNumberQuery}`
      );
      return response;
    } catch (error: unknown) {
      throw error;
    }
  }
};

export default addressSearchService;
