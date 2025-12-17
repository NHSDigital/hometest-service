import { test, expect } from '../../../fixtures/commonFixture';
import type { IAddressLookupResponse } from '../../../lib/apiClients/backendApiResources/AddressApiResource';

test.describe('Backend API, address endpoint', () => {
  test(
    'GET request, fetch addresses for given postcode',
    { tag: ['@api', '@get', '@address'] },
    async ({ backendApiResource }) => {
      const postcode = 'E18RD';
      const response =
        await backendApiResource.address.getAddressesByPostcode(postcode);
      expect(response.status(), 'Error while calling address endpoint').toEqual(
        200
      );

      const responseBody = (await response.json()) as IAddressLookupResponse;
      const addresses = responseBody.addressList;
      const address = addresses.find((result) => {
        const addressString: string = result.postcode;
        return addressString.includes('E1 8RD');
      });
      expect(
        address,
        'Address has not been found in the response'
      ).not.toBeUndefined();
    }
  );
});
