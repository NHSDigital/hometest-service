export interface IHealthCheckBloodTestOrder {
  phoneNumber?: string;
  address?: Address | null;
  searchParams?: SearchParams | null;
  isBloodTestSectionSubmitted?: boolean | null;
}

export interface Address {
  addressLine1: string;
  addressLine2: string;
  addressLine3: string;
  townCity: string;
  postcode: string;
}

export interface SearchParams {
  postcode: string;
  buildingNumber?: string;
}
