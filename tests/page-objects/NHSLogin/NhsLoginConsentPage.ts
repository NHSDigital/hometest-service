import { type Locator, type Page } from '@playwright/test';

export class NhsLoginConsentPage {
  readonly page: Page;
  // NHS Login consent page has an "agree" submit button — try common text variants
  readonly agreeToShareBtn: Locator;
  readonly continueBtn: Locator;
  readonly doNotAgreeToShareInformationLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.agreeToShareBtn = page.getByRole('button', {
      name: /I agree to share this information/i
    });
    // Fallback: some NHS Login consent pages just have a "Continue" button to accept
    this.continueBtn = page.locator('button[type="submit"]');
    this.doNotAgreeToShareInformationLink = page.getByRole('link', {
      name: /I do not agree/i
    });
  }

  async agreeAndContinue(): Promise<void> {
    // Wait for the page to fully load (do-not-agree link is the stable indicator)
    await this.doNotAgreeToShareInformationLink.waitFor({ timeout: 15000 });

    if (await this.agreeToShareBtn.isVisible()) {
      await this.agreeToShareBtn.click();
    } else {
      // Fall back to submit button (the main CTA that accepts consent)
      await this.continueBtn.click();
    }
  }
}
