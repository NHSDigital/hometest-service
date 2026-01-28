import { Page, Locator } from '@playwright/test';
import { config, EnvironmentVariables } from '../configuration';

export class HomeTestPage {
  readonly page: Page;
  readonly headerText: Locator;
  readonly startNowBtn: Locator;


  constructor(page: Page) {
    this.page = page;
    this.headerText = page.locator('h1');
    this.startNowBtn = page.getByRole('button', { name: 'Start now' });

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

  async getHeaderText(): Promise<string> {
    return await this.headerText.textContent() ?? "";
  }

  async clickStartNowButton(): Promise<void> {
    await this.startNowBtn.click();
  }
}
