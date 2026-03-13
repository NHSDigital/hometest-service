import { Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export class PrivacyPolicyPage extends BasePage {
  readonly makeAComplaintLink: Locator;
  readonly pageHeader: Locator;

  constructor(page: Page) {
    super(page);
    this.pageHeader = page.locator("h1", { hasText: "privacy policy" });
    this.makeAComplaintLink = page.getByRole("link", {
      name: "https://ico.org.uk/make-a-complaint/",
    });
  }

  async clickMakeAComplaintLink(): Promise<void> {
    await this.makeAComplaintLink.click();
  }

  async waitUntilPageLoaded(): Promise<void> {
    await this.pageHeader.waitFor({ state: "visible" });
  }

  async getHeaderText(): Promise<string> {
    return await this.pageHeader.textContent() ?? "";
  }

}
