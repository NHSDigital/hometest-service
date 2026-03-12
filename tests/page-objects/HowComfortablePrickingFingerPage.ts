import { Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export class HowComfortablePrickingFingerPage extends BasePage {
  readonly yesOption: Locator;
  readonly noOption: Locator;
  readonly continueButton: Locator;
  readonly bloodSampleGuideLink: Locator;
  readonly pageHeader: Locator;

  constructor(page: Page) {
    super(page);
    this.yesOption = page.locator("#comfortable-1");
    this.noOption = page.locator("#comfortable-2");
    this.continueButton = page.getByRole("button", { name: "Continue" });
    this.bloodSampleGuideLink = page.getByRole("link", { name: "Blood sample step-by-step guide" });
    this.pageHeader = page.locator("h1", { hasText: "This is what you'll need to do to give a blood sample" });
  }

  async waitUntilPageLoaded(): Promise<void> {
    await this.pageHeader.waitFor({ state: "visible" });
  }

  async clickContinue(): Promise<void> {
    await this.continueButton.click();
  }

  async selectYesOptionAndContinue(): Promise<void> {
    await this.yesOption.check();
    await this.continueButton.click();
  }

  async selectNoOptionAndContinue(): Promise<void> {
    await this.noOption.check();
    await this.continueButton.click();
  }

  async clickBloodSampleGuideLink(): Promise<void> {
    await this.bloodSampleGuideLink.click();
    await this.page.waitForURL("**/blood-sample-guide");
  }
}
