import { Page, Locator } from '@playwright/test';
import { config, EnvironmentVariables } from '../configuration';

export class HomeTestStartPage {
  readonly page: Page;
  readonly headerText: Locator;

  constructor(page: Page) {
    this.page = page;
    this.headerText = page.locator('h1');
  }
  async navigate(): Promise<void> {
    await this.page.goto(config.get(EnvironmentVariables.UI_BASE_URL));
  }

  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  async waitForPageLoaded(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
 
  }

  async getHeaderText(): Promise<string> {
    return await this.headerText.textContent() ?? "";
  }

}
