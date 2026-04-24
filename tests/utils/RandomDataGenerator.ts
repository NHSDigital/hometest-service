import { faker } from "@faker-js/faker";

export class RandomDataGenerator {
  static generateNhsNumber(): string {
    return `99${faker.number.int({ min: 10000000, max: 99999999 })}`;
  }

  static generateBirthDate(): string {
    return faker.date.birthdate({ min: 18, max: 65, mode: "age" }).toISOString().split("T")[0];
  }
}
