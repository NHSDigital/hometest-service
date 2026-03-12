import { Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage";
import { ConfigFactory, type ConfigInterface } from "../configuration/EnvironmentConfiguration";
import { type Supplier } from "../models/TestOrder";
import { L } from "@faker-js/faker/dist/airline-Dz1uGqgJ";

export class SuppliersPrivacyPolicyPage extends BasePage {
  readonly config: ConfigInterface;
    readonly pageHeader: Locator;

  constructor(page: Page) {
    super(page);
    this.pageHeader = page.locator("h1", { hasText: "privacy policy" });
    this.config = ConfigFactory.getConfig();
  }

async waitUntilPageLoaded(): Promise<void> {
    await this.pageHeader.waitFor({ state: "visible" });
  }

  async navigate(supplierInput: Supplier["supplier_name"]): Promise<void> {
    const url = `${this.config.uiBaseUrl}/suppliers-privacy-policy?supplier=${encodeURIComponent(supplierInput)}`;
    await this.page.goto(url);
  }

  async getHeaderText(): Promise<string> {
    return await this.pageHeader.textContent() ?? "";
  }

}
