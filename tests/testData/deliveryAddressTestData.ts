import { type DeliverAddress } from '../lib/apiClients/HealthCheckModel';

export function getDeliverAddressWithRequiredFields(): DeliverAddress {
  return {
    addressLine1: 'Health Check Street',
    townCity: 'Belfast',
    postcode: 'BT7 1JJ'
  };
}

export function getDeliverAddressWithAllFields(): DeliverAddress {
  const fullDeliveryAddress: DeliverAddress =
    getDeliverAddressWithRequiredFields();
  fullDeliveryAddress.addressLine2 = 'Team Dopamine 3';
  fullDeliveryAddress.addressLine3 = 'Test County';
  return fullDeliveryAddress;
}

export const getSanitizingAddressTestData = {
  stringWithSpecialChar: `&T1 <T2> "T3'`,
  sanitizedStringInDb: `&amp;T1 &lt;T2&gt; &quot;T3&#39;`
};

export const searchedPostcode = 'E1 8RD';
export const expectedAddress: DeliverAddress = {
  addressLine1: 'Flat 208',
  addressLine2: '85 Royal Mint Street',
  addressLine3: '',
  townCity: 'London',
  postcode: 'E1 8RD'
};
