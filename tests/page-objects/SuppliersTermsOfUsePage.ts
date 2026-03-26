import { Locator, Page } from "@playwright/test";

import { ConfigFactory, type ConfigInterface } from "../configuration/EnvironmentConfiguration";
import { type Supplier } from "../models/TestOrder";
import { AuthenticatedPage } from "./AuthenticatedPage";

export class SuppliersTermsOfUsePage extends AuthenticatedPage {
  readonly config: ConfigInterface;
  readonly pageHeader: Locator;

  constructor(page: Page) {
    super(page);
    this.config = ConfigFactory.getConfig();
    this.pageHeader = page.locator("h1", { hasText: "terms of use" });
  }

  async navigate(supplierInput: Supplier["supplier_name"]): Promise<void> {
    await this.navigateToProtectedPath(
      `/suppliers-terms-conditions?supplier=${encodeURIComponent(supplierInput)}`,
      this.pageHeader,
    );
  }

  async waitUntilPageLoaded(): Promise<void> {
    await this.pageHeader.waitFor({ state: "visible" });
  }
}
