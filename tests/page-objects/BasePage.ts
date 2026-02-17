import { Page, Locator } from '@playwright/test';
export abstract class BasePage {
  readonly page: Page;
  readonly headerText: Locator;

  constructor(page: Page) {
    this.headerText = page.locator('h1');
    this.page = page;
    this.headerText = page.locator('h1');

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

  async getHeaderText(): Promise<string> {
    return await this.headerText.textContent() ?? "";
  }
  
  async clickBackLink(): Promise<void> {
    await this.page.getByRole('link', { name: 'Back' }).click();
  }
}
