import type { DeliveryAddress } from './thriva-lab-order-request-model';
export interface ThrivaLabOrderResponseModel {
  data: Data;
}

export interface Data {
  id: string;
  type: string;
  attributes: Attributes;
}

export interface Attributes {
  order_external_reference: string;
  placed_at: string;
  test: {
    test_profiles: TestProfiles;
  };
  delivery_address: DeliveryAddress;
  user: IUser;
}

export interface IUser {
  user_id: string;
  user_external_reference: string;
}

export type TestProfiles = string[];
