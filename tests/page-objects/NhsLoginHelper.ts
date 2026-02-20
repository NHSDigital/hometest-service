import { type Page } from '@playwright/test';
import { ConfigFactory, type ConfigInterface } from '../configuration/configuration';
import type { NHSLoginUser } from '../utils/users/BaseUser';
import { NHSEmailAndPasswordPage } from './NHSLogin/NHSEmailAndPasswordPage';
import { CodeSecurityPage } from './NHSLogin/CodeSecurityPage';
import * as fs from 'fs';


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

    // Navigate to UI which will redirect through HomePage → LoginPage → NHS Login
    await page.goto(`${this.config.uiBaseUrl}`);

    // Wait for redirect to NHS Login (external login page)
    // URL is access.sandpit.signin.nhs.uk or similar
    try {
      await page.waitForURL(/signin\.nhs\.uk/, { timeout: 10000 });
      console.log(`Redirected to NHS Login: ${page.url()}`);
    } catch (error) {
      // Capture screenshot immediately when redirect to NHS Login fails
      const outputDir = 'testResults/global-setup-failures';
      fs.mkdirSync(outputDir, { recursive: true });
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const screenshotPath = `${outputDir}/nhs-login-redirect-failure-${timestamp}-screenshot.png`;
      
      try {
        await page.screenshot({
          path: screenshotPath,
          fullPage: true
        });
        console.error(`📸 Screenshot captured at NHS Login redirect failure: ${screenshotPath}`);
        console.error(`   Current URL: ${page.url()}`);
        console.error(`   Expected: URL matching /signin\\.nhs\\.uk/`);
        console.error(`   Page Title: ${await page.title().catch(() => 'N/A')}`);
      } catch (screenshotError) {
        console.error('❌ Failed to capture screenshot:', screenshotError);
      }
      
      // Re-throw the original error
      throw error;
    }

    await loginPage.fillAuthFormWithCredentialsAndClickContinue(nhsLoginUser);
    await codeSecurityPage.fillAuthOneTimePasswordAndClickContinue(
      nhsLoginUser.otp
    );
    
    // Wait for redirect to home page after successful login
    try {
      await page.waitForURL('**/get-self-test-kit-for-HIV', { timeout: 30000 });
    } catch (error) {
      // Capture screenshot immediately when redirect to home page fails
      const outputDir = 'testResults/global-setup-failures';
      fs.mkdirSync(outputDir, { recursive: true });
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const screenshotPath = `${outputDir}/home-page-redirect-failure-${timestamp}-screenshot.png`;
      
      try {
        await page.screenshot({
          path: screenshotPath,
          fullPage: true
        });
        console.error(`📸 Screenshot captured at home page redirect failure: ${screenshotPath}`);
        console.error(`   Current URL: ${page.url()}`);
        console.error(`   Expected: URL matching **/get-self-test-kit-for-HIV`);
        console.error(`   Page Title: ${await page.title().catch(() => 'N/A')}`);
      } catch (screenshotError) {
        console.error('❌ Failed to capture screenshot:', screenshotError);
      }
      
      // Re-throw the original error
      throw error;
    }
  }

  public async loginNhsUser(page: Page, user: NHSLoginUser): Promise<Page> {

  await this.fillNhsLoginFormsAndWaitForStartPage(user, page);
    return page;
  }
}
