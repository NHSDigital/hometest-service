export interface Address {
  id: string;
  line1: string;
  line2?: string;
  line3?: string;
  town: string;
  postcode: string;
  fullAddress: string;
}
