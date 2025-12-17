import { type Locator, type Page } from '@playwright/test';

export class NHSAppTermsAndConditionsPage {
  readonly page: Page;
  readonly tocAgreeCheckbox: Locator;
  readonly analyticsAgreeCheckbox: Locator;
  readonly continueBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.tocAgreeCheckbox = page.locator('#termsAndConditions-agree_checkbox');
    this.analyticsAgreeCheckbox = page.locator(
      '#analyticsCookie-agree_analyticsCookieCheckbox'
    );
    this.continueBtn = page.locator('#btn_accept');
  }

  async fillFormAndClickContinue(): Promise<void> {
    await this.tocAgreeCheckbox.check();
    await this.analyticsAgreeCheckbox.check();
    await this.continueBtn.click();
  }

  /**
   * Attempts to perform the provided action, and if it fails
   * (potentially due to the NHS App ToC appearing),
   * it fills the ToC form and retries the action.
   *
   * @param actionToPerform
   */
  async performActionWithRetryAfterPotentialNhsAppToc(
    actionToPerform: () => Promise<void>
  ): Promise<void> {
    try {
      await actionToPerform();
    } catch (error) {
      console.log(
        'Error occurred, attempting to handle NHS App ToC if present:',
        error
      );
      // Attempt to fill the ToC form and click continue, then retry the action
      await this.fillFormAndClickContinue();
      // retry the original action interrupted by the NHS App ToC
      await actionToPerform();
    }
  }

  async waitUntilLoaded(): Promise<void> {
    await this.tocAgreeCheckbox.waitFor();
  }
}
