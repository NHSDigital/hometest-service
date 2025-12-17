import { test, expect } from '../../fixtures/commonFixture';
import { AuditEventType } from '@dnhc-health-checks/shared';
import { SpecialUserKey } from '../../lib/users/SpecialUserKey';
import NhsLoginHelper from '../../page-objects/NhsLoginHelper';
import type { NHSLoginUser } from '../../lib/users/BaseUser';

const nhsLoginHelper = new NhsLoginHelper();

test(
  'Verify if consent not given user redirects to ConsentNotGiven error page',
  {
    tag: ['@ui', '@regression', '@login']
  },
  async ({
    context,
    page,
    nhsLoginPages,
    consentNotGivenErrorPage,
    userManager,
    config
  }) => {
    if (config.integratedEnvironment) {
      // Real  NHS Login
      const consentNotGivenUser = userManager.getSpecialUser(
        SpecialUserKey.CONSENT_NOT_GIVEN
      );
      await context.clearCookies();
      await nhsLoginPages.nhsFirstPage.goToTheQuestionnaireAppURL();
      await nhsLoginPages.nhsFirstPage.clickContinueBtn();
      await nhsLoginPages.nhsAppRedirectorPage.waitUntilLoadedAndClickContinue();
      await nhsLoginHelper.fillNhsLoginFormsAndWaitForNextPage(
        consentNotGivenUser as NHSLoginUser,
        page
      );
      await nhsLoginPages.nhsLoginConsent.doNotAgreeToShareInformationClick();
      await nhsLoginPages.consentConfirmation.doNotAgreeToShareInformationRadioClickAndContinue();
    } else {
      // Mocked NHS Login
      await nhsLoginPages.nhsFirstPage.goToTheQuestionnaireAppURLWithLoginMock(
        userManager.getSpecialUser(SpecialUserKey.CONSENT_NOT_GIVEN)
          .code as string
      );
    }

    await consentNotGivenErrorPage.waitUntilLoaded();
  }
);

test(
  'Verify if faulty / expired asserted login identity redirects to NHS Login login / password page',
  {
    tag: ['@ui', '@regression', '@login']
  },
  async ({ context, nhsLoginPages, config }) => {
    test.skip(!config.integratedEnvironment);
    await context.clearCookies();
    await nhsLoginPages.nhsFirstPage.goToTheFaultyAssertedLoginIdentityURL();
    await nhsLoginPages.nhsEmailPage.waitUntilLoaded();
  }
);

test(
  'Verify if faulty authorization code sent to the login endpoint redirects to NhsErrorLogin page',
  {
    tag: ['@ui', '@regression', '@login']
  },
  async ({ context, nhsLoginPages, nhsLoginError }) => {
    await context.clearCookies();
    await nhsLoginPages.nhsFirstPage.goToTheNHSLoginCallbackURLWithInvalidCode();
    await nhsLoginError.waitUntilLoaded();
  }
);

test(
  'Verify if user with invalid proofing level is redirected to NhsErrorLogin page',
  {
    tag: ['@ui', '@regression', '@login']
  },
  async ({
    nhsLoginPages,
    nhsLoginError,
    dbAuditEvent,
    userManager,
    config
  }) => {
    test.skip(config.integratedEnvironment);
    const testStartDate = new Date().toISOString();
    const mockedNotEligibleUserInvalidProofingLevel =
      userManager.getSpecialUser(
        SpecialUserKey.INELIGIBLE_INVALID_PROOFING_LEVEL
      );

    await test.step('Login as the mock user and verify the correct page is displayed', async () => {
      await nhsLoginPages.nhsFirstPage.goToTheQuestionnaireAppURLWithLoginMock(
        mockedNotEligibleUserInvalidProofingLevel.code as string
      );
      await nhsLoginError.waitUntilLoaded();
    });

    await test.step('Verify correct audit event was stored in the DB table', async () => {
      const lastMessage =
        await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
          mockedNotEligibleUserInvalidProofingLevel.nhsNumber,
          AuditEventType.PatientIneligibleInsufficientIdentityProofingLevel,
          testStartDate
        );
      expect(lastMessage).toBeTruthy();
    });
  }
);

test(
  'Verify if user with invalid sub claim in the UserInfo Response is redirected to NhsErrorLogin page',
  {
    tag: ['@ui', '@regression', '@login']
  },
  async ({
    nhsLoginPages,
    nhsLoginError,
    dbAuditEvent,
    userManager,
    config
  }) => {
    test.skip(config.integratedEnvironment);
    const testStartDate = new Date().toISOString();
    const mockedNotEligibleUserInvalidSubClaim = userManager.getSpecialUser(
      SpecialUserKey.INELIGIBLE_SUB_CLAIM_NOT_MATCH
    );

    await test.step('Login as the mock user and verify the correct page is displayed', async () => {
      await nhsLoginPages.nhsFirstPage.goToTheQuestionnaireAppURLWithLoginMock(
        mockedNotEligibleUserInvalidSubClaim.code as string
      );
      await nhsLoginError.waitUntilLoaded();
    });

    await test.step('Verify correct audit event was stored in the DB table', async () => {
      const lastMessage =
        await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
          mockedNotEligibleUserInvalidSubClaim.nhsNumber,
          AuditEventType.ErrorSubClaimNotMatching,
          testStartDate
        );
      expect(lastMessage).toBeTruthy();
    });
  }
);

test(
  'Verify if token call fails during login lambda processing the user is redirected to NhsErrorLogin page',
  {
    tag: ['@ui', '@regression', '@login']
  },
  async ({ nhsLoginPages, nhsLoginError, userManager, config }) => {
    test.skip(config.integratedEnvironment);
    await nhsLoginPages.nhsFirstPage.goToTheQuestionnaireAppURLWithLoginMock(
      userManager.getSpecialUser(SpecialUserKey.INELIGIBLE_TOKEN_FAILURE)
        .code as string
    );
    await nhsLoginError.waitUntilLoaded();
  }
);

test(
  'Verify if error occurs during SSO the user is redirected to NhsErrorLogin page',
  {
    tag: ['@ui', '@regression', '@login']
  },
  async ({ nhsLoginPages, nhsLoginError, userManager, config }) => {
    test.skip(config.integratedEnvironment);
    await nhsLoginPages.nhsFirstPage.goToTheQuestionnaireAppURLWithLoginMock(
      userManager.getSpecialUser(SpecialUserKey.INELIGIBLE_SSO_ERROR)
        .code as string
    );
    await nhsLoginError.waitUntilLoaded();
  }
);

test(
  'Verify if user info call fails the user is redirected to NhsErrorLogin page',
  {
    tag: ['@ui', '@regression', '@login']
  },
  async ({ nhsLoginPages, nhsLoginError, userManager, config }) => {
    test.skip(config.integratedEnvironment);
    await nhsLoginPages.nhsFirstPage.goToTheQuestionnaireAppURLWithLoginMock(
      userManager.getSpecialUser(SpecialUserKey.INELIGIBLE_USERINFO_FAILURE)
        .code as string
    );
    await nhsLoginError.waitUntilLoaded();
  }
);
