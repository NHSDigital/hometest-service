import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class BloodSampleGuidePage extends BasePage {
  readonly backLink: Locator;

  constructor(page: Page) {
    super(page);
    this.backLink = page.getByRole('link', { name: 'Back' });
  }

  async clickBackLink(): Promise<void> {
    await this.backLink.click();
  }
}
