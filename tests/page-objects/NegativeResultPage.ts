import { Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage";
import { ConfigFactory, type ConfigInterface } from "../configuration/EnvironmentConfiguration";

export class NegativeResultPage extends BasePage {
  readonly config: ConfigInterface;
  readonly result: Locator;

  constructor(page: Page) {
    super(page);
    this.config = ConfigFactory.getConfig();
    this.result = page.locator("p", { hasText: /^Negative$/ });
  }

  async navigateToOrderResult(orderId: string): Promise<void> {
    await this.page.goto(`${this.config.uiBaseUrl}/orders/${orderId}/results`);
  }

  async waitForResultsToLoad(): Promise<void> {
    await this.result.waitFor();
  }

  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }
}
