import { Page, Locator } from '@playwright/test';

export class WPHomePage {
  readonly page: Page;
  readonly url: string = 'https://www.wp.pl';

  constructor(page: Page) {
    this.page = page;
  }

  async navigate(): Promise<void> {
    await this.page.goto(this.url);
  }

  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  async verifyPageLoaded(): Promise<boolean> {
    await this.page.waitForLoadState('domcontentloaded');
    return true;
  }
}
