import { type Locator, type Page } from 'playwright';

export class TestScenariosPage {
  readonly page: Page;
  readonly pageHeader: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageHeader = page.locator('h1:has-text("Test Scenarios")');
  }

  async waitUntilLoaded(): Promise<void> {
    await this.pageHeader.waitFor();
  }
}
