import addressData from "../test-data/Address.json";

export interface Address {
  postCode: string;
  addressLine1: string;
  addressLine2?: string;
  addressLine3?: string;
  townCity: string;
}

export class AddressModel implements Address {
  postCode: string;
  addressLine1: string;
  addressLine2?: string;
  addressLine3?: string;
  townCity: string;

  constructor(data: Address) {
    this.postCode = data.postCode;
    this.addressLine1 = data.addressLine1;
    this.addressLine2 = data.addressLine2;
    this.addressLine3 = data.addressLine3;
    this.townCity = data.townCity;
  }

  static fromJson(data: Address): AddressModel {
    return new AddressModel(data);
  }

  static getRandomAddress(): AddressModel {
    const randomIndex = Math.floor(Math.random() * addressData.length);
    const raw = addressData[randomIndex];
    const mapped: Address = {
      postCode: raw.postCode,
      addressLine1: raw.addressLine1,
      addressLine2: raw.addressLine2,
      addressLine3: raw.addressLine3,
      townCity: raw.townCity,
    };
    return new AddressModel(mapped);
  }
}
