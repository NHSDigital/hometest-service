import { Locator, Page } from "@playwright/test";

import { BasePage } from "./BasePage";

export class KitNotAvailableInYourAreaPage extends BasePage {
  readonly findAnotherSexualHealthClinicLink: Locator;
  readonly pageHeader: Locator;

  constructor(page: Page) {
    super(page);
    this.findAnotherSexualHealthClinicLink = page.getByRole("link", {
      name: "Find another sexual health clinic",
    });
    this.pageHeader = page.locator("h1", {
      hasText: "Free HIV self-test kits are not available in your area using this service",
    });
  }

  async waitUntilPageLoaded(): Promise<void> {
    await this.pageHeader.waitFor({ state: "visible" });
  }

  async getFindAnotherSexualHealthClinicLinkUrl(): Promise<string> {
    const href = await this.findAnotherSexualHealthClinicLink.getAttribute("href");
    return href ?? "";
  }
}
