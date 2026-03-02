import personalDetails from '../test-data/PersonalDetails.json';

export interface PersonalDetails {
  mobileNumber: string;
}

export class PersonalDetailsModel implements PersonalDetails {
  mobileNumber: string;
  constructor(data: PersonalDetails) {
    this.mobileNumber = data.mobileNumber;
  }

  static fromJson(data: PersonalDetails): PersonalDetailsModel {
    return new PersonalDetailsModel(data);
  }

  static getRandomPersonalDetails(): PersonalDetailsModel {
    const randomIndex = Math.floor(Math.random() * personalDetails.length);
    return new PersonalDetailsModel(personalDetails[randomIndex]);
  }
}
