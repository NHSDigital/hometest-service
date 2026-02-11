import { userPasswordGeneric, OTP } from '../credentials';

export interface Keys {
  passwordGeneric: string;
  OTP: string;
}

export class CredentialsHelper {
  public async addCredentialsToEnvVariable(): Promise<void> {
      console.log('Credentials taken from credentials.ts file');
      process.env.GENERIC_PASS = userPasswordGeneric as string;
      process.env.OTP = OTP as string;
  }
}
