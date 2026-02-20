import { type Page } from '@playwright/test';
import { ConfigFactory, type ConfigInterface } from '../configuration/configuration';
import type { NHSLoginUser } from '../utils/users/BaseUser';
import { NHSEmailAndPasswordPage } from './NHSLogin/NHSEmailAndPasswordPage';
import { CodeSecurityPage } from './NHSLogin/CodeSecurityPage';
import { NhsLoginConsentPage } from './NHSLogin/NhsLoginConsentPage';


export default class NhsLoginHelper {

    readonly config: ConfigInterface;
    constructor() {
        this.config = ConfigFactory.getConfig();
    }

  public async fillNhsLoginFormsAndWaitForStartPage(
    nhsLoginUser: NHSLoginUser,
    page: Page
  ): Promise<void> {
    const loginPage = new NHSEmailAndPasswordPage(page);
    const codeSecurityPage = new CodeSecurityPage(page);
    const consentPage = new NhsLoginConsentPage(page);

    // Navigate to UI which will redirect through HomePage → LoginPage → NHS Login
    await page.goto(`${this.config.uiBaseUrl}`);

    // Wait for redirect to NHS Login (external login page)
    // URL is access.sandpit.signin.nhs.uk or similar
    await page.waitForURL(/signin\.nhs\.uk/, { timeout: 60000 });
    console.log(`Redirected to NHS Login: ${page.url()}`);

    await loginPage.fillAuthFormWithCredentialsAndClickContinue(nhsLoginUser);
    await codeSecurityPage.fillAuthOneTimePasswordAndClickContinue(
      nhsLoginUser.otp
    );

    // Handle NHS Login consent page if it appears (first login or expired consent)
    // Race between consent page and direct app redirect — whichever arrives first
    const consentAppeared = await Promise.race([
      page.waitForURL(/nhs-login-consent/, { timeout: 15000 }).then(() => true),
      page.waitForURL('**/get-self-test-kit-for-HIV', { timeout: 15000 }).then(() => false)
    ]).catch(() => false);

    if (consentAppeared) {
      console.log('Consent page detected, agreeing to share information...');
      await consentPage.agreeAndContinue();
    }

    await page.waitForURL('**/get-self-test-kit-for-HIV', { timeout: 60000 });
  }

  public async loginNhsUser(page: Page, user: NHSLoginUser): Promise<Page> {

  await this.fillNhsLoginFormsAndWaitForStartPage(user, page);
    return page;
  }
}
