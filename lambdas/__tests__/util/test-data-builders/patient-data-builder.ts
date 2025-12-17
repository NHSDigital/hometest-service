import { type IPatientData } from '../../../src/lib/models/patient/patient';

export class PatientDataBuilder {
  private readonly nhsNumber: string = '1234567890';
  private readonly dateOfBirth: string = '1977-01-01';
  private readonly firstName: string = 'John';
  private readonly lastName: string = 'Doe';
  private readonly email: string = 'john@doe.com';
  private readonly gpOdsCode: string = 'A12345';
  private readonly patientId: string = '123';

  build(): IPatientData {
    return {
      patientId: this.patientId,
      nhsNumber: this.nhsNumber,
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      dateOfBirth: this.dateOfBirth,
      gpOdsCode: this.gpOdsCode
    };
  }
}
