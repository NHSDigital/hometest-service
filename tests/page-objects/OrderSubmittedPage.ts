import { Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export class OrderSubmittedPage extends BasePage {
  readonly pageHeader: Locator;
  constructor(page: Page) {
    super(page);
    this.pageHeader = page.locator("h1", { hasText: "Order submitted" });


  }
  async waitUntilPageLoaded(): Promise<void> {
    await this.pageHeader.waitFor({ state: "visible" });
  }
}
