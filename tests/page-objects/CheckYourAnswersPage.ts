import { Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export class CheckYourAnswersPage extends BasePage {
  readonly consentCheckbox: Locator;
  readonly submitOrderButton: Locator;

  constructor(page: Page) {
    super(page);
    this.consentCheckbox = page.locator("#consent-1");
    this.submitOrderButton = page.getByRole("button", { name: "Submit order" });
  }

  async selectConsentCheckbox(): Promise<void> {
    await this.consentCheckbox.check();
  }

  async clickSubmitOrder(): Promise<void> {
    await this.submitOrderButton.click();
  }
}
