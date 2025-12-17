import { type Locator, type Page } from '@playwright/test';

export class NhsLoginConsent {
  readonly page: Page;
  readonly doNotAgreeToShareInformationLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.doNotAgreeToShareInformationLink = page.getByRole('link', {
      name: 'I do not agree to share this information'
    });
  }

  async doNotAgreeToShareInformationClick(): Promise<void> {
    await this.doNotAgreeToShareInformationLink.click();
  }

  async waitUntilLoaded(): Promise<void> {
    await this.doNotAgreeToShareInformationLink.waitFor();
  }
}
