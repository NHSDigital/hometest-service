import { type Locator, type Page } from "@playwright/test";

export class CodeSecurityPage {
  readonly page: Page;
  readonly securityCodeField: Locator;
  readonly rememberDeviceCheckbox: Locator;
  readonly continueBtn: Locator;
  readonly acceptAllCookies: Locator;
  readonly chooseYourCookies: Locator;

  constructor(page: Page) {
    this.page = page;
    this.securityCodeField = page.locator("#otp-input");
    this.rememberDeviceCheckbox = page.locator("#rmd");
    this.continueBtn = page.locator('button:has-text("Continue")');
    this.acceptAllCookies = page.locator("#nhsuk-cookie-banner__link_accept");
    this.chooseYourCookies = page.locator("#nhsuk-cookie-banner__link");
  }

  async fillAuthOneTimePassword(oneTimePassword: string): Promise<void> {
    await this.securityCodeField.waitFor();
    await this.securityCodeField.fill(oneTimePassword);
  }

  async fillAuthOneTimePasswordAndClickContinue(oneTimePassword: string): Promise<void> {
    await this.waitForOtpTrigger();
    await this.fillAuthOneTimePassword(oneTimePassword);
    await this.continueBtn.click();
  }

  async checkTheRememberDeviceBox(): Promise<void> {
    await this.rememberDeviceCheckbox.click();
  }

  async waitForOtpTrigger(): Promise<void> {
    await this.page.waitForResponse(
      (response) =>
        response.url().includes("trigger-otp") &&
        response.request().method() === "POST" &&
        response.status() === 200,
    );
  }
}
