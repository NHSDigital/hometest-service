import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  passwordInput: Locator;

    constructor(page: Page) {
    this.page = page;

    // Locators
     this.passwordInput = this.page.locator('[name="password"]');

  }

  async enterPassword(): Promise<void> {
await this.passwordInput.fill('nhs-home-test');
  }
}
