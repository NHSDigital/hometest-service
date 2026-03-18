import { Locator, Page } from "@playwright/test";
import { AuthenticatedPage } from "./AuthenticatedPage";

export class OrderStatusPage extends AuthenticatedPage {
  readonly statusTag: Locator;
  readonly orderedDate: Locator;
  readonly referenceNumber: Locator;
  readonly orderReference: Locator;
  readonly suppliersTermsOfUseLink: Locator;
  readonly suppliersPrivacyPolicyLink: Locator;
  readonly pageHeader: Locator;

  constructor(page: Page) {
    super(page);
    this.pageHeader = page.locator("h1.nhsuk-heading-l", { hasText: "HIV self-test" });
    this.statusTag = page.locator("#order-status-tag");
    this.orderedDate = page.getByLabel(/Order date/);
    this.referenceNumber = page.locator("#reference-number");
    this.orderReference = page.getByLabel(/^Reference number:/);
    this.suppliersTermsOfUseLink = page.locator('a[href*="suppliers-terms-conditions"]');
    this.suppliersPrivacyPolicyLink = page.locator('a[href*="suppliers-privacy-policy"]');
    this.pageHeader = page.locator("h1", { hasText: "HIV self-test" });
  }

  async navigateToOrder(orderId: string): Promise<void> {
    await this.navigateToProtectedPath(`/orders/${orderId}/tracking`, this.pageHeader);
  }

  async navigateToOrderExpectingPath(
    orderId: string,
    readyLocator: Locator,
    expectedPath: string,
  ): Promise<void> {
    await this.navigateToProtectedPath(`/orders/${orderId}/tracking`, readyLocator, [expectedPath]);
  }

  async openOrderDirect(orderId: string): Promise<void> {
    await this.page.goto(`${this.config.uiBaseUrl}/orders/${orderId}/tracking`);
  }

  async waitForOrderToLoad(): Promise<void> {
    await this.orderedDate.waitFor({ state: "visible" });
  }

  async waitUntilPageLoaded(): Promise<void> {
    await this.pageHeader.waitFor({ state: "visible" });
  }

  async getOrderReference(): Promise<string> {
    const labelText = await this.orderReference.innerText();
    const displayedNumber = labelText.replace("Reference number", "").trim();
    return displayedNumber;
  }

  async clickSuppliersTermsOfUseLink(): Promise<void> {
    await this.suppliersTermsOfUseLink.click();
    await this.page.waitForURL(/suppliers-terms-conditions/);
  }

  async clickSuppliersPrivacyPolicyLink(): Promise<void> {
    await this.suppliersPrivacyPolicyLink.click();
    await this.page.waitForURL(/suppliers-privacy-policy/);
  }
}
