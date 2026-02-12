import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { ConfigFactory, type ConfigInterface } from '../configuration/configuration';

export class OrderStatusPage extends BasePage {
  readonly config: ConfigInterface;
  readonly orderHeading: Locator;
  readonly statusTag: Locator;
  readonly orderedDate: Locator;
  readonly referenceNumber: Locator;

  constructor(page: Page) {
    super(page);
    this.orderHeading = page.locator('h1.nhsuk-heading-l', { hasText: "HIV self-test" });
    this.statusTag = page.locator('#order-status-tag');
    this.orderedDate = page.locator('#order-date');
    this.referenceNumber = page.locator('#reference-number');
    this.config = ConfigFactory.getConfig();

  }

  async navigateToOrder(orderId: string): Promise<void> {
    await this.page.goto(`${this.config.uiBaseUrl}/orders/${orderId}/tracking`);
  }
}
