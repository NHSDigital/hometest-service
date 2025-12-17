export interface ISession {
  nhsNumber: string;
  sessionId: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  accessToken: string;
  odsCode: string;
  ttl: number;
  source: UserSource;
  rumIdentityId: string;
  refreshToken: string;
  urlSource?: string;
}

export enum UserSource {
  NHSApp = 'nhs-app',
  Browser = 'browser'
}
