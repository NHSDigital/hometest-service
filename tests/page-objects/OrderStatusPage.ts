import { Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage";
import { ConfigFactory, type ConfigInterface } from "../configuration/EnvironmentConfiguration";

export class OrderStatusPage extends BasePage {
  readonly config: ConfigInterface;
  readonly orderHeading: Locator;
  readonly statusTag: Locator;
  readonly orderedDate: Locator;
  readonly referenceNumber: Locator;
  readonly orderNotFoundMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.orderHeading = page.locator("h1.nhsuk-heading-l", { hasText: "HIV self-test" });
    this.statusTag = page.locator("#order-status-tag");
    this.orderedDate = page.locator('span[aria-label*="Order date"]');
    this.referenceNumber = page.locator("#reference-number");
    this.config = ConfigFactory.getConfig();
    this.orderNotFoundMessage = page
      .getByRole("alert")
      .locator("p", { hasText: "We could not find this order." });
  }

  async navigateToOrder(orderId: string): Promise<void> {
    await this.page.goto(`${this.config.uiBaseUrl}/orders/${orderId}/tracking`);
  }

  async waitForOrderToLoad(): Promise<void> {
    await this.orderedDate.waitFor({ state: "visible" });
  }
}
