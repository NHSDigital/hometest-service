export interface Address {
  id: string;
  line1: string;
  line2?: string;
  line3?: string;
  line4?: string;
  town: string;
  postcode: string;
  fullAddress: string;
}


export interface PostcodeLookupResponse {
  postcode: string;
  addresses: Address[] | null;
  status: 'found' | 'not_found' | 'error';
}
