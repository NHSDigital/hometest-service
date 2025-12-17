import { type Locator, type Page } from '@playwright/test';

export class NHSAppRedirectorPage {
  readonly page: Page;
  readonly pageHeader: Locator;
  readonly continueBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageHeader = page.locator(
      'h1:has-text("Use NHS App services"), h1:has-text("Access your NHS services")'
    );
    this.continueBtn = page.locator('#viewInstructionsButton');
  }

  async clickContinue(): Promise<void> {
    await this.continueBtn.click();
  }

  async waitUntilLoadedAndClickContinue(): Promise<void> {
    await this.waitUntilLoaded();
    await this.clickContinue();
  }

  async waitUntilLoaded(): Promise<void> {
    await this.pageHeader.waitFor();
  }
}
