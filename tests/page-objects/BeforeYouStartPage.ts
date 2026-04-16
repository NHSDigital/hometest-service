import { Locator, Page } from "@playwright/test";

import { AuthenticatedPage } from "./AuthenticatedPage";

export class BeforeYouStartPage extends AuthenticatedPage {
  private static readonly startPagePath = "/before-you-start";
  readonly pageHeader: Locator;
  readonly continueToOrderKitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.continueToOrderKitButton = this.page.getByRole("button", { name: "Continue to order a kit" });
    this.pageHeader = page.getByRole("heading", { name: "Before you order a free HIV self-test kit", level: 1 });
  }

  async waitUntilPageLoaded(): Promise<void> {
    await this.pageHeader.waitFor({ state: "visible" });
  }

  async navigate(): Promise<void> {
    await this.navigateToProtectedPath(BeforeYouStartPage.startPagePath, this.pageHeader);
  }

  async clickContinueToOrderaKitButton(): Promise<void> {
    await this.continueToOrderKitButton.click();
  }



}
