import { Page, Locator } from '@playwright/test';
import { config, EnvironmentVariables } from '../configuration';

export class HomeTestPage {
  readonly page: Page;
  readonly getHeaderText: Locator;
  private readonly header1 = 'h1';

  constructor(page: Page) {
    this.page = page;
    this.getHeaderText = page.locator(this.header1);
  }
  async navigate(): Promise<void> {
    await this.page.goto(config.get(EnvironmentVariables.UI_BASE_URL));
  }

  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  async verifyPageLoaded(): Promise<boolean> {
    try {
      await this.page.waitForLoadState('domcontentloaded');
      return true;
    } catch {
      return false;
    }
  }

  async getText(): Promise<string> {
    return await this.getHeaderText.textContent() ?? "";
  }

}
