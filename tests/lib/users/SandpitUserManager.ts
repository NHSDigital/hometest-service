import type { Page } from '@playwright/test';
import { BaseUserManager } from './BaseUserManager';
import { SpecialUserKey } from './SpecialUserKey';
import type { NHSLoginUser } from './BaseUser';
import NhsLoginHelper from '../../page-objects/NhsLoginHelper';

export class SandpitUserManager extends BaseUserManager<NHSLoginUser> {
  public getWorkerUsers(): NHSLoginUser[] {
    return [
      {
        email: 'onboarding.nhsapp+dhc.p9user13@gmail.com',
        nhsNumber: '9425931437',
        odsCode: 'F00041',
        age: 40,
        otp: process.env.OTP as unknown as string,
        password: process.env.DHC_PASS as unknown as string,
        description: 'eligible user',
        patientId: 'ffaa22d6-4f39-4ede-93a1-cc75a9927f95'
      },

      {
        email: 'onboarding.nhsapp+dhc.p9user14@gmail.com',
        nhsNumber: '9098824633',
        odsCode: 'F00041',
        age: 44,
        otp: process.env.OTP as unknown as string,
        password: process.env.DHC_PASS as unknown as string,
        description: 'eligible user',
        patientId: '4c5b0248-871c-4225-9263-9b8c7881c61b'
      },
      {
        email: 'onboarding.nhsapp+dhc.p9user15@gmail.com',
        nhsNumber: '9596274201',
        odsCode: 'F00041',
        age: 50,
        otp: process.env.OTP as unknown as string,
        password: process.env.DHC_PASS as unknown as string,
        description: 'eligible user',
        patientId: '3292c1d9-9c67-46eb-9043-25c51b9b7064'
      },
      {
        email: 'onboarding.nhsapp+dhc.p9user16@gmail.com',
        nhsNumber: '9071893898',
        odsCode: 'F00041',
        age: 65,
        otp: process.env.OTP as unknown as string,
        password: process.env.DHC_PASS as unknown as string,
        description: 'eligible user',
        patientId: '8748f708-1f97-4bff-9b98-246f40ad7087'
      }
    ];
  }

  protected getSpecialUsers(): Map<string, NHSLoginUser> {
    const specialUsersMap = new Map<string, NHSLoginUser>();

    specialUsersMap.set(SpecialUserKey.CONSENT_NOT_GIVEN, {
      email: 'onboarding.nhsapp+dhc.p9user11@gmail.com',
      nhsNumber: '9437354928',
      odsCode: 'F00041',
      otp: process.env.OTP as unknown as string,
      password: process.env.DHC_PASS as unknown as string,
      description:
        'user without consent given to share details with Digital NHS Health Checks service'
    });

    specialUsersMap.set(SpecialUserKey.ELIGIBLE_USER, {
      email: 'onboarding.nhsapp+dhc.p9user1@gmail.com',
      nhsNumber: '9442364952',
      odsCode: 'F00041',
      age: 50,
      otp: process.env.OTP as unknown as string,
      password: process.env.DHC_PASS as unknown as string,
      description: 'eligible user',
      patientId: '3e470e09-1af2-4263-be82-7038c7711024'
    });

    specialUsersMap.set(SpecialUserKey.ELIGIBLE_USER_2, {
      email: 'onboarding.nhsapp+dhc.p9user2@gmail.com',
      nhsNumber: '9285931022',
      odsCode: 'F00041',
      age: 66,
      otp: process.env.OTP as unknown as string,
      password: process.env.DHC_PASS as unknown as string,
      description: 'eligible user',
      patientId: '150f7590-72b5-4432-8c19-ddbb81697fc2'
    });

    specialUsersMap.set(SpecialUserKey.LOGOUT_DEDICATED_USER, {
      email: 'onboarding.nhsapp+dhc.p9user17@gmail.com',
      nhsNumber: '9140022218',
      odsCode: 'F00041',
      age: 70,
      otp: process.env.OTP as unknown as string,
      password: process.env.DHC_PASS as unknown as string,
      description: 'eligible user',
      patientId: 'abef18a3-f418-4f02-9e39-58bee33bda85'
    });

    specialUsersMap.set(SpecialUserKey.ELIGIBLE_E2E_DEDICATED_USER, {
      email: 'onboarding.nhsapp+dhc.p9user3@gmail.com',
      nhsNumber: '9033886480',
      odsCode: 'F00041',
      age: 65,
      otp: process.env.OTP as unknown as string,
      password: process.env.DHC_PASS as unknown as string,
      description: 'eligible user',
      patientId: '339ddbae-fb5e-4325-aa52-8540b85ddeeb'
    });

    specialUsersMap.set(SpecialUserKey.INELIGIBLE_USER_OVERAGE_BOUNDARY, {
      email: 'onboarding.nhsapp+dhc.p9user7@gmail.com',
      nhsNumber: '9525395766',
      odsCode: 'F00041',
      otp: process.env.OTP as unknown as string,
      password: process.env.DHC_PASS as unknown as string,
      description: 'user over required age threshold'
    });

    specialUsersMap.set(SpecialUserKey.INELIGIBLE_USER_UNDERAGE_BOUNDARY, {
      email: 'onboarding.nhsapp+dhc.p9user6@gmail.com',
      nhsNumber: '9357282726',
      odsCode: 'F00041',
      otp: process.env.OTP as unknown as string,
      password: process.env.DHC_PASS as unknown as string,
      description: 'user below required age threshold'
    });

    return specialUsersMap;
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
