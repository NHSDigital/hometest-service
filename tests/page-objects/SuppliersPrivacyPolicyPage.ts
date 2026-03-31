import { Locator, Page } from "@playwright/test";

import { ConfigFactory, type ConfigInterface } from "../configuration/EnvironmentConfiguration";
import { type Supplier } from "../models/TestOrder";
import { AuthenticatedPage } from "./AuthenticatedPage";

export class SuppliersPrivacyPolicyPage extends AuthenticatedPage {
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
    await this.navigateToProtectedPath(
      `/suppliers-privacy-policy?supplier=${encodeURIComponent(supplierInput)}`,
      this.pageHeader,
    );
  }

  async getHeaderText(): Promise<string> {
    return (await this.pageHeader.textContent()) ?? "";
  }
}
