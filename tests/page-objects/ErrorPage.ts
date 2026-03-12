import { Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export class ErrorPage extends BasePage {
  readonly orderNotFoundMessage: Locator;
  readonly pageHeader: Locator;

  constructor(page: Page) {
    super(page);
    this.orderNotFoundMessage = page
      .getByRole("alert")
      .locator("p", { hasText: "We could not find this order." });
    this.pageHeader = page.locator("h1", { hasText: "Error" });
}

  async waitUntilPageLoaded(): Promise<void> {
    await this.pageHeader.waitFor({ state: "visible" });
  }
}
