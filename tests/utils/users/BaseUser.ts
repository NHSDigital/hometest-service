export class BaseTestUser {
  nhsNumber?: string;
  odsCode?: string;
  patientId?: string;
  age?: number;
  dob?: string;
  code?: string;
}

export interface NHSLoginMockedUser extends BaseTestUser {
  code: string;
  familyName?: string;
  givenName?: string;
  identityProofingLevel?: string;
  email?: string;
  phoneNumber?: string;
  gpOdsCode?: string;
}

export interface NHSLoginUser extends BaseTestUser {
  otp: string;
  password: string;
  email: string;
  description: string;
}
