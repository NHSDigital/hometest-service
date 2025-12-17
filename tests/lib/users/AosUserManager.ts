import type { Page } from '@playwright/test';
import { BaseUserManager } from './BaseUserManager';
import { SpecialUserKey } from './SpecialUserKey';
import type { NHSLoginUser } from './BaseUser';
import NhsLoginHelper from '../../page-objects/NhsLoginHelper';

export class AosUserManager extends BaseUserManager<NHSLoginUser> {
  public getWorkerUsers(): NHSLoginUser[] {
    return [
      {
        email: 'nhsapp.aos+dhc.p9user13@gmail.com',
        nhsNumber: '9732749512',
        odsCode: 'F00041',
        age: 49,
        otp: process.env.OTP as unknown as string,
        password: process.env.DHC_PASS as unknown as string,
        description: 'eligible user',
        patientId: '9bdc7bf9-f4d9-40d8-9e46-1e76317f75d2'
      },
      {
        email: 'nhsapp.aos+dhc.p9user14@gmail.com',
        nhsNumber: '9732749539',
        odsCode: 'F00041',
        age: 52,
        otp: process.env.OTP as unknown as string,
        password: process.env.DHC_PASS as unknown as string,
        description: 'eligible user',
        patientId: '27f8926b-1fa8-4c54-b37e-e146223687cf'
      },
      {
        email: 'nhsapp.aos+dhc.p9user16@gmail.com',
        nhsNumber: '9422366496',
        odsCode: 'F00041',
        age: 40,
        otp: process.env.OTP as unknown as string,
        password: process.env.DHC_PASS as unknown as string,
        description: 'eligible user',
        patientId: 'f385a33a-eb3c-47f3-af37-b3e099c7ef91'
      },
      {
        email: 'nhsapp.aos+dhc.p9user17@gmail.com',
        nhsNumber: '9995178664',
        odsCode: 'F00041',
        age: 45,
        otp: process.env.OTP as unknown as string,
        password: process.env.DHC_PASS as unknown as string,
        description: 'eligible user',
        patientId: 'eb9f344f-4204-4b68-a539-2c35c3852108'
      },
      {
        email: 'nhsapp.aos+dhc.p9user18@gmail.com',
        nhsNumber: '9269389170',
        odsCode: 'F00041',
        age: 51,
        otp: process.env.OTP as unknown as string,
        password: process.env.DHC_PASS as unknown as string,
        description: 'eligible user',
        patientId: 'cd7f162a-07e3-4c32-af2e-f9367828678d'
      }
    ];
  }

  protected getSpecialUsers(): Map<string, NHSLoginUser> {
    const specialUsersMap = new Map<string, NHSLoginUser>();

    specialUsersMap.set(SpecialUserKey.CONSENT_NOT_GIVEN, {
      email: 'nhsapp.aos+dhc.p9user11@gmail.com',
      nhsNumber: '9032238485',
      odsCode: 'F00041',
      otp: process.env.OTP as unknown as string,
      password: process.env.DHC_PASS as unknown as string,
      description:
        'user without consent given to share details with Digital NHS Health Checks service'
    });

    specialUsersMap.set(SpecialUserKey.ELIGIBLE_USER, {
      email: 'nhsapp.aos+dhc.p9user1@gmail.com',
      nhsNumber: '9967803509',
      odsCode: 'F00041',
      age: 50,
      otp: process.env.OTP as unknown as string,
      password: process.env.DHC_PASS as unknown as string,
      description: 'eligible user',
      patientId: '813cdb24-5cb1-4e25-a1e1-411ab1cf056f'
    });

    specialUsersMap.set(SpecialUserKey.ELIGIBLE_USER_2, {
      email: 'nhsapp.aos+dhc.p9user2@gmail.com',
      nhsNumber: '9641825763',
      odsCode: 'F00041',
      age: 65,
      otp: process.env.OTP as unknown as string,
      password: process.env.DHC_PASS as unknown as string,
      description: 'eligible user',
      patientId: '46f8e796-3337-4da6-b64f-a51976a3e1a0'
    });

    specialUsersMap.set(SpecialUserKey.LOGOUT_DEDICATED_USER, {
      email: 'nhsapp.aos+dhc.p9user3@gmail.com',
      nhsNumber: '9776363377',
      odsCode: 'F00041',
      age: 64,
      otp: process.env.OTP as unknown as string,
      password: process.env.DHC_PASS as unknown as string,
      description: 'eligible user',
      patientId: 'fabdd56b-a459-440c-b628-20886d78c65b'
    });

    specialUsersMap.set(SpecialUserKey.ELIGIBLE_E2E_DEDICATED_USER, {
      email: 'nhsapp.aos+dhc.p9user15@gmail.com', // used for e2e test, do not use or modify
      nhsNumber: '9732749555',
      odsCode: 'F00041',
      age: 54,
      otp: process.env.OTP as unknown as string,
      password: process.env.DHC_PASS as unknown as string,
      description: 'eligible user',
      patientId: '4dfe84a3-8e5f-4f93-a213-0a9a1b999eca'
    });

    specialUsersMap.set(SpecialUserKey.INELIGIBLE_USER_OVERAGE_BOUNDARY, {
      email: 'nhsapp.aos+dhc.p9user7@gmail.com',
      nhsNumber: '9610054781',
      odsCode: 'F00041',
      otp: process.env.OTP as unknown as string,
      password: process.env.DHC_PASS as unknown as string,
      description: 'user over required age threshold'
    });

    specialUsersMap.set(SpecialUserKey.INELIGIBLE_USER_UNDERAGE_BOUNDARY, {
      email: 'nhsapp.aos+dhc.p9user6@gmail.com',
      nhsNumber: '9971347083',
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
