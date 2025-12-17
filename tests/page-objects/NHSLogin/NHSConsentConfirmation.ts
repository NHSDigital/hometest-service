import { type Locator, type Page } from '@playwright/test';

export class ConsentConfirmation {
  readonly page: Page;
  readonly continueBtn: Locator;
  readonly doNotAgreeToShareInformationRadio: Locator;

  constructor(page: Page) {
    this.page = page;
    this.continueBtn = page.locator('button:has-text("Continue")');
    this.doNotAgreeToShareInformationRadio = page.locator(
      '[data-qa="not-agree-to-share"]'
    );
  }

  async doNotAgreeToShareInformationRadioClickAndContinue(): Promise<void> {
    await this.doNotAgreeToShareInformationRadio.click();
    await this.continueBtn.click();
  }

  async waitUntilLoaded(): Promise<void> {
    await this.doNotAgreeToShareInformationRadio.waitFor();
  }
}
