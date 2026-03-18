import { Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export class TermsOfUsePage extends BasePage {
  readonly cyberAwareLink: Locator;
  readonly helpAndSupportLink: Locator;
  readonly homeTestPrivacyPolicyLink: Locator;
  readonly pageHeader: Locator;

  constructor(page: Page) {
    super(page);
    this.cyberAwareLink = page.getByRole("link", { name: "Cyber Aware website" });
    this.helpAndSupportLink = page.getByRole("link", { name: /help and support page/i }).first();
    this.homeTestPrivacyPolicyLink = page
      .getByRole("link", { name: "Hometest Privacy Policy" })
      .first();
    this.pageHeader = page.locator("h1", {
      hasText: "Hometest Terms of Use - Draft V1 January 2026",
    });
  }

  async clickCyberAwareLink(): Promise<void> {
    await this.cyberAwareLink.click();
  }

  async clickHelpAndSupportLink(): Promise<void> {
    await this.helpAndSupportLink.click();
  }

  async clickHomeTestPrivacyPolicyLink(): Promise<void> {
    await this.homeTestPrivacyPolicyLink.click();
  }

  async waitUntilPageLoaded(): Promise<void> {
    await this.pageHeader.waitFor({ state: "visible" });
  }
}
