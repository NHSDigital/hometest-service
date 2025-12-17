import { type IPatient } from '../../../src/lib/models/patient/patient';

export class PatientBuilder {
  private readonly nhsNumber: string = '1234567890';
  private readonly nhsLoginId: string = '11111111';
  private readonly dateOfBirth: string = '1977-01-01';
  private readonly gpOdsCode: string = 'A12345';
  private readonly acceptedTermsVersion: string = '1.0';
  private readonly patientId: string = '123';

  build(): IPatient {
    return {
      nhsNumber: this.nhsNumber,
      nhsLoginId: this.nhsLoginId,
      dateOfBirth: this.dateOfBirth,
      gpOdsCode: this.gpOdsCode,
      acceptedTermsVersion: this.acceptedTermsVersion,
      patientId: this.patientId
    };
  }
}
