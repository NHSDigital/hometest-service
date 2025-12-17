export interface IPatient {
  patientId: string;
  nhsNumber: string;
  nhsLoginId: string;
  dateOfBirth: string;
  gpOdsCode: string;
  acceptedTermsVersion?: string;
}

export interface IPatientData {
  patientId: string;
  nhsNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  gpOdsCode: string;
}
