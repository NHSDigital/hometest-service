import { type Page } from '@playwright/test';
import {
  ConfigFactory,
  type ConfigInterface
} from '../configuration/EnvironmentConfiguration';
import type { NHSLoginUser } from '../utils/users/BaseUser';
import { NHSEmailAndPasswordPage } from './NHSLogin/NHSEmailAndPasswordPage';
import { CodeSecurityPage } from './NHSLogin/CodeSecurityPage';
import { NhsLoginConsentPage } from './NHSLogin/NhsLoginConsentPage';
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
    const consentPage = new NhsLoginConsentPage(page);

    // Log file for debugging
    const logFile = 'testResults/nhs-login-debug.log';
    fs.mkdirSync('testResults', { recursive: true });
    const log = (message: string) => {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] ${message}\n`;
      console.log(message); // Also log to console
      fs.appendFileSync(logFile, logMessage);
    };

    log('=== NHS Login Flow Started ===');

    // Capture all browser console messages
    page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      const location = msg.location();

      log(`[Browser Console - ${type.toUpperCase()}] ${text}`);
      if (location.url) {
        log(`  ↳ ${location.url}:${location.lineNumber}:${location.columnNumber}`);
      }
    });

    // Capture all network requests and responses
    page.on('request', (request) => {
      log(`[Network Request] ${request.method()} ${request.url()}`);
      const postData = request.postData();
      if (postData) {
        log(`  ↳ Body: ${postData.substring(0, 200)}${postData.length > 200 ? '...' : ''}`);
      }
    });

    page.on('response', async (response) => {
      const status = response.status();
      const statusText = response.statusText();
      const url = response.url();

      log(`[Network Response] ${status} ${statusText} - ${response.request().method()} ${url}`);

      // Log response body for non-2xx responses or specific content types
      if (status >= 400 || url.includes('/api/')) {
        try {
          const contentType = response.headers()['content-type'] || '';
          if (contentType.includes('application/json')) {
            const body = await response.text();
            log(`  ↳ Response Body: ${body.substring(0, 500)}${body.length > 500 ? '...' : ''}`);
          }
        } catch (error) {
          log(`  ↳ Could not read response body: ${error}`);
        }
      }
    });

    log(`Navigating to: ${this.config.uiBaseUrl}`);
    await page.goto(`${this.config.uiBaseUrl}`);
    await page.waitForURL(/signin\.nhs\.uk/, { timeout: 60000 });
    log(`Redirected to NHS Login: ${page.url()}`);

    log('Filling login credentials...');
    await loginPage.fillAuthFormWithCredentialsAndClickContinue(nhsLoginUser);

    log('Entering OTP code...');
    await codeSecurityPage.fillAuthOneTimePasswordAndClickContinue(
      nhsLoginUser.otp
    );

    // Handle NHS Login consent page if it appears (first login or expired consent)
    // Race between consent page and direct app redirect — whichever arrives first
    log('Waiting for consent page or redirect...');
    const consentAppeared = await Promise.race([
      page.waitForURL(/nhs-login-consent/, { timeout: 15000 }).then(() => true),
      page.waitForURL('**/get-self-test-kit-for-HIV', { timeout: 15000 }).then(() => false)
    ]).catch(() => false);

    if (consentAppeared) {
      log('Consent page detected, agreeing to share information...');
      await consentPage.agreeAndContinue();
    } else {
      log('No consent page - direct redirect to app');
    }

    log('Waiting for final redirect to app...');
    await page.waitForURL('**/get-self-test-kit-for-HIV', { timeout: 60000 });
    log('=== NHS Login Flow Completed Successfully ===');
  }

  public async loginNhsUser(page: Page, user: NHSLoginUser): Promise<Page> {
    await this.fillNhsLoginFormsAndWaitForStartPage(user, page);
    return page;
  }
}
