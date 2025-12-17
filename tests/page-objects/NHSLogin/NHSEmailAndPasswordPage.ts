import { type Locator, type Page } from '@playwright/test';
import type { NHSLoginUser } from '../../lib/users/BaseUser';

export class NHSEmailAndPasswordPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly errMsg: Locator;
  readonly continueBtn: Locator;
  readonly pageHeader: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input#user-email');
    this.passwordInput = page.locator('input#password-input');
    this.errMsg = page.locator('.nhsuk-error-message');
    this.continueBtn = page.locator('button:has-text("Continue")');
    this.pageHeader = page.locator('h1:has-text("Enter your email address")');
  }

  async fillAuthFormWithCredentialsAndClickContinue(
    nhsLoginUser: NHSLoginUser
  ): Promise<void> {
    await this.emailInput.waitFor();
    await this.emailInput.fill(nhsLoginUser.email);
    await this.passwordInput.fill(nhsLoginUser.password);
    await this.continueBtn.click();
  }

  async waitUntilLoaded(): Promise<void> {
    await this.emailInput.waitFor();
  }
}
