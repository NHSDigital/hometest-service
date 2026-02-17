import { Locator, Page } from '@playwright/test';

export abstract class BasePage {
  readonly page: Page;
  readonly headerText: Locator;

  constructor(page: Page) {
    this.headerText = page.locator('h1');
    this.page = page;
  }

  async waitUntilPageLoad(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
  }

  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }

  async clickBackLink(): Promise<void> {
    await this.page.getByRole('link', { name: 'Back' }).click();
  }
}
