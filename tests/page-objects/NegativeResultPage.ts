import { Locator, Page } from "@playwright/test";
import { AuthenticatedPage } from "./AuthenticatedPage";

export class NegativeResultPage extends AuthenticatedPage {
  readonly result: Locator;
  readonly orderReference: Locator;
  readonly pageHeader: Locator;

  constructor(page: Page) {
    super(page);
    this.result = page.locator("p", { hasText: /^Negative$/ });
    this.orderReference = page.getByLabel(/^Reference number:/);
    this.pageHeader = page.locator("h1", { hasText: "HIV self-test result" });
  }

  async navigateToOrderResult(orderId: string): Promise<void> {
    await this.navigateToProtectedPath(`/orders/${orderId}/results`, this.pageHeader);
  }

  async navigateToOrderResultExpectingPath(
    orderId: string,
    readyLocator: Locator,
    expectedPath: string,
  ): Promise<void> {
    await this.navigateToProtectedPath(`/orders/${orderId}/results`, readyLocator, [expectedPath]);
  }

  async openOrderResultDirect(orderId: string): Promise<void> {
    await this.page.goto(`${this.config.uiBaseUrl}/orders/${orderId}/results`);
  }

  async waitUntilPageLoaded(): Promise<void> {
    await this.pageHeader.waitFor({ state: "visible" });
  }

  async waitForResultsToLoad(): Promise<void> {
    await this.result.waitFor();
  }

  async getOrderReference(): Promise<string> {
    const labelText = await this.orderReference.innerText();
    const displayedNumber = labelText.replace("Reference number", "").trim();
    return displayedNumber;
  }
}
