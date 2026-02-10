import type { Page } from '@playwright/test';
import { BaseUserManager } from './BaseUserManager';
import type { NHSLoginUser } from './BaseUser';
import NhsLoginHelper from '../../page-objects/NhsLoginHelper';

export class SandBoxUserManager extends BaseUserManager<NHSLoginUser> {
  public getWorkerUsers(): NHSLoginUser[] {
    return [
      {
        email: 'testuserlive@demo.signin.nhs.uk',
        nhsNumber: '9686368973',
        odsCode: 'C83615',
        age: 49,
        otp: process.env.OTP as unknown as string,
        password: process.env.GENERIC_PASS as unknown as string,
        description: 'eligible user',
        patientId: '9bdc7bf9-f4d9-40d8-9e46-1e76317f75d2'
      },
      {
        email: 'testuserlive+1@demo.signin.nhs.uk',
        nhsNumber: '9686368906',
        odsCode: 'C83615',
        age: 52,
        otp: process.env.OTP as unknown as string,
        password: process.env.GENERIC_PASS as unknown as string,
        description: 'eligible user',
        patientId: '27f8926b-1fa8-4c54-b37e-e146223687cf'
      },
      {
        email: 'testuserlive+3@demo.signin.nhs.uk',
        nhsNumber: '9658218873',
        odsCode: 'A20047',
        age: 40,
        otp: process.env.OTP as unknown as string,
        password: process.env.GENERIC_PASS as unknown as string,
        description: 'eligible user',
        patientId: 'f385a33a-eb3c-47f3-af37-b3e099c7ef91'
      },
      {
        email: 'testuserlive+4@demo.signin.nhs.uk',
        nhsNumber: '9658218881',
        odsCode: 'A20047',
        age: 45,
        otp: process.env.OTP as unknown as string,
        password: process.env.GENERIC_PASS as unknown as string,
        description: 'eligible user',
        patientId: 'eb9f344f-4204-4b68-a539-2c35c3852108'
      },
    ];
  }

  protected async loginWorkerUser(
    user: NHSLoginUser,
    page: Page
  ): Promise<Page> {
    console.log(`Logging in the user : ${user.email} (${user.nhsNumber})`);
    const loginHelper = new NhsLoginHelper();
    return await loginHelper.loginNhsUser(page, user);
  }
}
