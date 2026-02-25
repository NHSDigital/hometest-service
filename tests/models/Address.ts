import addressData from '../test-data/address.json';

export interface Address {
  postcode: string;
  addressline1: string;
  addressline2: string;
  addressline3: string;
  towncity: string;
}

export class AddressModel implements Address {
  postcode: string;
  addressline1: string;
  addressline2: string;
  addressline3: string;
  towncity: string;

  constructor(data: Address) {
    this.postcode = data.postcode;
    this.addressline1 = data.addressline1;
    this.addressline2 = data.addressline2;
    this.addressline3 = data.addressline3;
    this.towncity = data.towncity;
  }

  static fromJson(data: Address): AddressModel {
    return new AddressModel(data);
  }

  static getRandomAddress(): AddressModel {
    const randomIndex = Math.floor(Math.random() * addressData.length);
    return new AddressModel(addressData[randomIndex]);
  }
}

