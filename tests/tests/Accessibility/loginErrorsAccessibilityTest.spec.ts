import { test, expect } from '../../fixtures/commonFixture';
import AxeBuilder from '@axe-core/playwright';
import {
  createHtmlAccessibilityReport,
  tagList
} from '../../lib/AccessibilityTestReportHelper';
import NhsLoginHelper from '../../page-objects/NhsLoginHelper';
import { SpecialUserKey } from '../../lib/users/SpecialUserKey';
import type { NHSLoginUser } from '../../lib/users/BaseUser';

const nhsLoginHelper = new NhsLoginHelper();

// No consent error page is not available in main branch
test(
  'Logging Error Pages Accessibility tests',
  {
    tag: ['@accessibility', '@regression']
  },
  async ({
    page,
    context,
    nhsLoginPages,
    consentNotGivenErrorPage,
    nhsLoginError,
    userManager,
    config
  }) => {
    test.skip(!config.integratedEnvironment);
    await test.step('Verify no consent error page with NHS Login', async () => {
      const testUser = userManager.getSpecialUser(
        SpecialUserKey.CONSENT_NOT_GIVEN
      );
      await context.clearCookies();
      await nhsLoginPages.nhsFirstPage.goToTheQuestionnaireAppURL();
      await nhsLoginPages.nhsFirstPage.clickContinueBtn();
      await nhsLoginPages.nhsAppRedirectorPage.waitUntilLoadedAndClickContinue();
      await nhsLoginHelper.fillNhsLoginFormsAndWaitForNextPage(
        testUser as NHSLoginUser,
        page
      );
      await nhsLoginPages.nhsLoginConsent.doNotAgreeToShareInformationClick();
      await nhsLoginPages.consentConfirmation.doNotAgreeToShareInformationRadioClickAndContinue();
      await consentNotGivenErrorPage.waitUntilLoaded();

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(tagList)
        .analyze();
      expect(
        await createHtmlAccessibilityReport(
          accessibilityScanResults,
          'NoConsentErrorPage',
          'NhsLogin',
          consentNotGivenErrorPage
        )
      ).toHaveLength(0);
    });

    await test.step('Verify nhs login error page', async () => {
      await context.clearCookies();
      await nhsLoginPages.nhsFirstPage.goToTheNHSLoginCallbackURLWithInvalidCode();
      await nhsLoginError.waitUntilLoaded();

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(tagList)
        .analyze();
      expect(
        await createHtmlAccessibilityReport(
          accessibilityScanResults,
          'NhsLoginErrorPage',
          'NhsLogin',
          nhsLoginError
        )
      ).toHaveLength(0);
    });
  }
);

test(
  'Logging Error Pages Accessibility tests on Mock Login',
  {
    tag: ['@accessibility', '@regression']
  },
  async ({
    page,
    context,
    nhsLoginPages,
    consentNotGivenErrorPage,
    nhsLoginError,
    userManager,
    config
  }) => {
    test.skip(config.integratedEnvironment);
    await test.step('Verify no consent error page with Mock NHS Login', async () => {
      await context.clearCookies();
      await nhsLoginPages.nhsFirstPage.goToTheQuestionnaireAppURLWithLoginMock(
        userManager.getSpecialUser(SpecialUserKey.CONSENT_NOT_GIVEN)
          .code as string
      );
      await consentNotGivenErrorPage.waitUntilLoaded();

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(tagList)
        .analyze();
      expect(
        await createHtmlAccessibilityReport(
          accessibilityScanResults,
          'NoConsentErrorPage',
          'NhsLogin',
          consentNotGivenErrorPage
        )
      ).toHaveLength(0);
    });

    await test.step('Verify nhs login error page', async () => {
      await context.clearCookies();
      await nhsLoginPages.nhsFirstPage.goToTheQuestionnaireAppURLWithLoginMock(
        userManager.getSpecialUser(SpecialUserKey.INELIGIBLE_TOKEN_FAILURE)
          .code as string
      );
      await nhsLoginError.waitUntilLoaded();

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(tagList)
        .analyze();
      expect(
        await createHtmlAccessibilityReport(
          accessibilityScanResults,
          'NhsLoginErrorPage',
          'NhsLogin',
          nhsLoginError
        )
      ).toHaveLength(0);
    });
  }
);
