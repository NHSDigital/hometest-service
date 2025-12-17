import type { Page } from '@playwright/test';
import { BaseUserManager } from './BaseUserManager';
import { ConfigFactory } from '../../env/config';
import { SpecialUserKey } from './SpecialUserKey';
import type { NHSLoginMockedUser } from './BaseUser';

export enum TestScenarioCodes {
  mock_code_eligible_patient_1 = 'mock_code_eligible_patient_1',
  mock_code_eligible_patient_2 = 'mock_code_eligible_patient_2',
  mock_code_eligible_patient_3 = 'mock_code_eligible_patient_3',
  mock_code_eligible_patient_4 = 'mock_code_eligible_patient_4',
  mock_code_eligible_patient_5 = 'mock_code_eligible_patient_5',
  mock_code_eligible_patient_6 = 'mock_code_eligible_patient_6',
  mock_code_eligible_patient_7 = 'mock_code_eligible_patient_7',
  mock_code_user_valid_upper_boundary = 'mock_code_user_valid_upper_boundary',
  mock_code_eligible_patient_upper_boundary_day_before_75th_birthday = 'mock_code_eligible_patient_upper_boundary_day_before_75th_birthday',
  mock_code_user_ineligible_underage_boundary = 'mock_code_user_ineligible_underage_boundary',
  mock_code_user_ineligible_underage = 'mock_code_user_ineligible_underage',
  mock_code_ineligible_patient_insufficient_proofing_level = 'mock_code_ineligible_patient_insufficient_proofing_level',
  mock_code_ineligible_patient_underage_day_before_40th_birthday = 'mock_code_ineligible_patient_underage_day_before_40th_birthday',
  mock_code_ineligible_patient_overage_75_years = 'mock_code_ineligible_patient_overage_75_years',
  mock_code_ineligible_patient_ods_code_disabled = 'mock_code_ineligible_patient_ods_code_disabled',
  mock_code_lack_of_consent_to_share_details = 'mock_code_lack_of_consent_to_share_details',
  mock_code_token_call_failure = 'mock_code_token_call_failure',
  mock_code_patient_ineligible_due_to_sub_claim_not_matching = 'mock_code_patient_ineligible_due_to_sub_claim_not_matching',
  mock_code_sso_error = 'mock_code_sso_error',
  mock_code_user_info_call_failure = 'mock_code_user_info_call_failure',
  mock_code_ineligible_patient_nhs_number_disabled = 'mock_code_ineligible_patient_nhs_number_disabled',
  mock_code_patient_for_logout_api_test = 'mock_code_patient_for_logout_api_test'
}

export class MockUserManager extends BaseUserManager<NHSLoginMockedUser> {
  protected getWorkerUsers(): NHSLoginMockedUser[] {
    return [
      {
        code: TestScenarioCodes.mock_code_eligible_patient_1,
        nhsNumber: '0010000001',
        odsCode: 'mock_enabled_code',
        age: 50
      },
      {
        code: TestScenarioCodes.mock_code_eligible_patient_2,
        nhsNumber: '0010000002',
        odsCode: 'mock_enabled_code',
        age: 45
      },
      {
        code: TestScenarioCodes.mock_code_eligible_patient_3,
        nhsNumber: '0010000003',
        odsCode: 'mock_enabled_code',
        age: 45
      },
      {
        code: TestScenarioCodes.mock_code_eligible_patient_4,
        nhsNumber: '0010000004',
        odsCode: 'mock_enabled_code',
        age: 45
      },
      {
        code: TestScenarioCodes.mock_code_eligible_patient_5,
        nhsNumber: '0010000005',
        odsCode: 'mock_enabled_code',
        age: 45
      },
      {
        code: TestScenarioCodes.mock_code_eligible_patient_6,
        nhsNumber: '0010000006',
        odsCode: 'mock_enabled_code',
        age: 45
      },
      {
        code: TestScenarioCodes.mock_code_eligible_patient_7,
        nhsNumber: '0010000007',
        odsCode: 'mock_enabled_code',
        age: 45
      }
    ];
  }
  protected getSpecialUsers(): Map<string, NHSLoginMockedUser> {
    const specialUsersMap = new Map<string, NHSLoginMockedUser>();

    specialUsersMap.set(SpecialUserKey.CONSENT_NOT_GIVEN, {
      code: TestScenarioCodes.mock_code_lack_of_consent_to_share_details,
      nhsNumber: '0000000000',
      odsCode: 'mock_enabled_code'
    });

    specialUsersMap.set(SpecialUserKey.LOGOUT_DEDICATED_USER, {
      code: TestScenarioCodes.mock_code_eligible_patient_upper_boundary_day_before_75th_birthday,
      nhsNumber: '0020000002',
      odsCode: 'mock_enabled_code',
      age: 74
    });

    specialUsersMap.set(SpecialUserKey.INELIGIBLE_USER_OVERAGE_BOUNDARY, {
      code: TestScenarioCodes.mock_code_ineligible_patient_overage_75_years,
      nhsNumber: '0020000006',
      odsCode: 'mock_enabled_code'
    });

    specialUsersMap.set(SpecialUserKey.INELIGIBLE_USER_UNDERAGE_BOUNDARY, {
      code: TestScenarioCodes.mock_code_ineligible_patient_underage_day_before_40th_birthday,
      nhsNumber: '0020000003',
      odsCode: 'mock_enabled_code'
    });

    specialUsersMap.set(SpecialUserKey.NOT_WHITELISTED_NHS_NUMBER, {
      code: TestScenarioCodes.mock_code_ineligible_patient_nhs_number_disabled,
      nhsNumber: '0020000009',
      odsCode: 'mock_enabled_code'
    });

    specialUsersMap.set(SpecialUserKey.INELIGIBLE_INVALID_PROOFING_LEVEL, {
      code: TestScenarioCodes.mock_code_ineligible_patient_insufficient_proofing_level,
      nhsNumber: '0020000005',
      odsCode: 'mock_enabled_code'
    });

    specialUsersMap.set(SpecialUserKey.INELIGIBLE_SUB_CLAIM_NOT_MATCH, {
      code: TestScenarioCodes.mock_code_patient_ineligible_due_to_sub_claim_not_matching,
      nhsNumber: '0020000010',
      odsCode: 'mock_enabled_code'
    });

    specialUsersMap.set(SpecialUserKey.INELIGIBLE_TOKEN_FAILURE, {
      code: TestScenarioCodes.mock_code_token_call_failure,
      nhsNumber: '0000000000'
    });

    specialUsersMap.set(SpecialUserKey.INELIGIBLE_SSO_ERROR, {
      code: TestScenarioCodes.mock_code_sso_error,
      nhsNumber: '0000000000'
    });

    specialUsersMap.set(SpecialUserKey.INELIGIBLE_USERINFO_FAILURE, {
      code: TestScenarioCodes.mock_code_user_info_call_failure,
      nhsNumber: '0000000000'
    });

    specialUsersMap.set(SpecialUserKey.PATIENT_FOR_LOGOUT_API_TEST, {
      code: TestScenarioCodes.mock_code_patient_for_logout_api_test,
      nhsNumber: '0020000009',
      odsCode: 'mock_enabled_code'
    });

    specialUsersMap.set(SpecialUserKey.INELIGIBLE_ODS_CODE_DISABLED_USER, {
      code: TestScenarioCodes.mock_code_ineligible_patient_ods_code_disabled,
      nhsNumber: '0020000008',
      odsCode: 'mock_disabled_code'
    });

    return specialUsersMap;
  }

  protected async loginWorkerUser(
    user: NHSLoginMockedUser,
    page: Page
  ): Promise<Page> {
    console.log(`Logging in the user : ${user.nhsNumber}`);
    const config = ConfigFactory.getConfig();
    await page.goto(
      `${config.questionnaireAppURL}/sso?assertedLoginIdentity=${user.code}`
    );
    const startButtonLocator = 'button:has-text("Start now")';
    const termsAndConditionsCheckBox = '#terms-and-conditions-1';
    const healthCheckVersionMigration = '#update-health-check-version-1';

    await page.waitForSelector(
      `${startButtonLocator}, h1:has-text("NHS Health Check"), ${termsAndConditionsCheckBox}`
    );

    if (await page.isVisible(startButtonLocator)) {
      await page.locator(startButtonLocator).click();
      await page.locator('#terms-and-conditions-1').check();
      await page.locator('button:has-text("Continue")').click();
      await page.waitForSelector('h1:has-text("NHS Health Check")');
    }

    if (await page.isVisible(healthCheckVersionMigration)) {
      await page.locator(healthCheckVersionMigration).check();
      await page.locator('button:has-text("Continue")').click();
      await page.locator('#terms-and-conditions-1').check();
      await page.locator('button:has-text("Continue")').click();
      await page.waitForSelector('h1:has-text("NHS Health Check")');
    }

    if (await page.isVisible(termsAndConditionsCheckBox)) {
      await page.locator('#terms-and-conditions-1').check();
      await page.locator('button:has-text("Continue")').click();
      await page.waitForSelector('h1:has-text("NHS Health Check")');
    }
    return page;
  }
}
