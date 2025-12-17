import { test, expect } from '../../../fixtures/commonFixture';
import { CredentialsHelper } from '../../../lib/CredentialsHelper';
import { AuditEventType } from '@dnhc-health-checks/shared';
import type {
  BaseTestUser,
  NHSLoginMockedUser,
  NHSLoginUser
} from '../../../lib/users/BaseUser';
import { SpecialUserKey } from '../../../lib/users/SpecialUserKey';
import {
  getOdsCodeJsonData,
  type OdsItem
} from '../../../testData/odsCodeData';

let userUnderTest: BaseTestUser;
let disabledOdsCode: OdsItem;

export function disabledOdsCodeTest(): void {
  test.beforeAll(
    async ({
      dbAuditEvent,
      dbOdsCodeService,
      dbPatientService,
      config,
      userManager
    }) => {
      await new CredentialsHelper().addCredentialsToEnvVariable();
      disabledOdsCode = getOdsCodeJsonData({ enabled: false });
      await dbOdsCodeService.createGpOdsCodeItem(disabledOdsCode);

      if (!config.integratedEnvironment) {
        userUnderTest = userManager.getSpecialUser(
          SpecialUserKey.INELIGIBLE_ODS_CODE_DISABLED_USER
        ) as NHSLoginMockedUser;
      } else {
        userUnderTest = userManager.getSpecialUser(
          SpecialUserKey.LOGOUT_DEDICATED_USER
        ) as NHSLoginUser;
      }

      await dbPatientService.updatePatientOdsCode(
        userUnderTest.nhsNumber,
        disabledOdsCode.gpOdsCode
      );
      await dbAuditEvent.deleteItemByNhsNumber(userUnderTest.nhsNumber);
    }
  );

  test.afterAll(async ({ dbOdsCodeService, dbPatientService, config }) => {
    if (config.integratedEnvironment) {
      await dbPatientService.updatePatientOdsCode(
        userUnderTest.nhsNumber,
        userUnderTest.odsCode as string
      );
      await dbOdsCodeService.deleteGpOdsCodeItem(disabledOdsCode.gpOdsCode);
    }
  });

  test(
    'Verify if Patient with OdsCode disabled is not eligible with NHS Mock Login',
    {
      tag: ['@ui', '@regression']
    },
    async ({
      nhsLoginPages,
      odsNhsNumberNotEligiblePage,
      dbAuditEvent,
      config
    }) => {
      test.skip(config.integratedEnvironment);
      const testStartDate = new Date().toISOString();

      await nhsLoginPages.nhsFirstPage.goToTheQuestionnaireAppURLWithLoginMock(
        (userUnderTest as NHSLoginMockedUser).code
      );
      await odsNhsNumberNotEligiblePage.waitUntilLoaded();

      expect(await odsNhsNumberNotEligiblePage.getHeaderText()).toContain(
        'Contact your GP surgery'
      );

      const lastMessage =
        await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
          (userUnderTest as NHSLoginMockedUser).nhsNumber,
          AuditEventType.PatientIneligibleOdsCodeDisabled,
          testStartDate
        );
      expect(lastMessage).toBeTruthy();
    }
  );
}
