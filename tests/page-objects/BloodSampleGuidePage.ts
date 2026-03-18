import { Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export class BloodSampleGuidePage extends BasePage {
  readonly pageHeader: Locator;

  constructor(page: Page) {
    super(page);
    this.pageHeader = page.locator("h1", { hasText: "Blood sample step-by-step guide" });
  }

  async waitUntilPageLoaded(): Promise<void> {
    await this.pageHeader.waitFor({ state: "visible" });
  }
}
