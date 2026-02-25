import { Address } from  './address';

export interface PostcodeLookupResponse {
  postcode: string;
  addresses: Address[] | null;
  status: 'found' | 'not_found' | 'error';
}
