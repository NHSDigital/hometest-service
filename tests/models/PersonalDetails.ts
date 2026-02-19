import personaldetails from '../test-data/personaldetails.json';

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
    const randomIndex = Math.floor(Math.random() * personaldetails.length);
    return new PersonalDetailsModel(personaldetails[randomIndex]);
  }
}
