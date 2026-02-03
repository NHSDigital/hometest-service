import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { config, EnvironmentVariables } from '../configuration';

export class OrderTrackingPage extends BasePage {
  readonly orderHeading: Locator;
  readonly statusTag: Locator;
  readonly orderedDate: Locator;
  readonly referenceNumber: Locator;
  readonly statusHeading: Locator;
  readonly resultsLink: Locator;
  readonly deliveryTimeframe: Locator;
  readonly errorAlert: Locator;

  constructor(page: Page) {
    super(page);
    this.orderHeading = page.locator('h1').first();
    this.statusTag = page.locator('.nhsuk-tag');
    this.orderedDate = page.locator('p.nhsuk-body').first();
    this.referenceNumber = page.locator('text=Reference number');
    this.statusHeading = page.locator('h2.nhsuk-heading-m').first();
    this.resultsLink = page.getByRole('link', { name: /view.*result|result/i }).or(
      page.locator('a[href*="result"]')
    );
    this.deliveryTimeframe = page.locator('text=/within \\d+ working days/');
    this.errorAlert = page.locator('[role=\'alert\']');
  }

  async navigateToOrder(orderId: string): Promise<void> {
    await this.page.goto(`${config.get(EnvironmentVariables.UI_BASE_URL)}/orders/${orderId}/tracking`);
  }
}
