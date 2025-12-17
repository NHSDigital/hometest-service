export interface ThrivaLabOrderRequestModel {
  data: Data;
}

export interface Data {
  type: string;
  attributes: Attributes;
}

export interface Attributes {
  delivery_address: DeliveryAddress;
  user: User;
  test: {
    test_profiles: TestProfiles;
  };
  order_external_reference: string;
}

export interface DeliveryAddress {
  name: string;
  company_name?: string;
  line1: string;
  line2?: string;
  line3?: string;
  city: string;
  state?: string;
  postcode: string;
  country: string;
}

export interface ContactDetail {
  first_name: string;
  last_name: string;
  email?: string;
  mobile_phone_number?: string;
}

export interface User {
  contact: ContactDetail;
  date_of_birth: string;
  sex: ThrivaSex;
  user_external_reference: string;
}

export enum ThrivaLabTestType {
  Hba1c = 'GHB',
  Cholesterol = 'TCHDL'
}

export enum ThrivaSex {
  Female = 'female',
  Male = 'male'
}

export type TestProfiles = string[];
