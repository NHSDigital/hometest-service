import { Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage";
import { ConfigFactory, type ConfigInterface } from "../configuration/EnvironmentConfiguration";
import { type Supplier } from "../models/TestOrder";

export class SuppliersTermsOfUsePage extends BasePage {
  readonly config: ConfigInterface;
    readonly pageHeader: Locator;

  constructor(page: Page) {
    super(page);
    this.config = ConfigFactory.getConfig();
    this.pageHeader = page.locator("h1", { hasText: "terms of use" });
  }

  async navigate(supplierInput: Supplier["supplier_name"]): Promise<void> {
    const url = `${this.config.uiBaseUrl}/suppliers-terms-conditions?supplier=${encodeURIComponent(supplierInput)}`;
    await this.page.goto(url);
  }

  async waitUntilPageLoaded(): Promise<void> {
    await this.pageHeader.waitFor({ state: "visible" });
  }
}
