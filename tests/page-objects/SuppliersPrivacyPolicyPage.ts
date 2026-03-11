import { Page } from "@playwright/test";
import { BasePage } from "./BasePage";
import { ConfigFactory, type ConfigInterface } from "../configuration/EnvironmentConfiguration";
import { type Supplier } from "../models/TestOrder";

export class SuppliersPrivacyPolicyPage extends BasePage {
  readonly config: ConfigInterface;

  constructor(page: Page) {
    super(page);
    this.config = ConfigFactory.getConfig();
  }

  async navigate(supplierInput: Supplier["supplier_name"]): Promise<void> {
    const url = `${this.config.uiBaseUrl}/suppliers-privacy-policy?supplier=${encodeURIComponent(supplierInput)}`;
    await this.page.goto(url);
  }
}
