export interface ILabOrder {
  id: string;
  testTypes: LabTestType[];
  deliveryAddress: IDeliveryAddress;
  phoneNumber?: string;
  healthCheckId: string;
  provider: Provider;
  createdAt: string;
  fulfilmentOrderId?: string;
}

export interface IDeliveryAddress {
  addressLine1: string;
  addressLine2: string;
  addressLine3: string;
  townCity: string;
  postcode: string;
}

export enum LabTestType {
  HbA1c = 'HbA1c',
  Cholesterol = 'Cholesterol'
}

export enum Provider {
  Thriva = 'thriva'
}
