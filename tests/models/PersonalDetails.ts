import personalDetails from "../test-data/PersonalDetails.json";

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

  private static pool: typeof personalDetails = [...personalDetails];

  static getRandomPersonalDetails(): PersonalDetailsModel {
    if (PersonalDetailsModel.pool.length === 0) {
      PersonalDetailsModel.pool = [...personalDetails];
    }
    const randomIndex = Math.floor(Math.random() * PersonalDetailsModel.pool.length);
    const [item] = PersonalDetailsModel.pool.splice(randomIndex, 1);
    return new PersonalDetailsModel(item);
  }
}
