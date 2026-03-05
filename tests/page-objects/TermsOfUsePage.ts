import { Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export class TermsOfUsePage extends BasePage {
  readonly CyberAwareLink: Locator;
  readonly HelpAndSupportLink: Locator;
  readonly HomeTestPrivacyPolicyLink: Locator;

  constructor(page: Page) {
    super(page);
    this.CyberAwareLink = page.getByRole("link", { name: "Cyber Aware website" });
    this.HelpAndSupportLink = page.getByRole("link", {
      name: "https://www.nhs.uk/nhs-app/help/",
    });
    this.HomeTestPrivacyPolicyLink = page.getByRole("link", { name: "Hometest Privacy Policy" });
  }

  async clickCyberAwareLink(): Promise<void> {
    await this.CyberAwareLink.click();
  }

  async clickHelpAndSupportLink(): Promise<void> {
    await this.HelpAndSupportLink.click();
  }

  async clickHomeTestPrivacyPolicyLink(): Promise<void> {
    await this.HomeTestPrivacyPolicyLink.click();
  }

}
