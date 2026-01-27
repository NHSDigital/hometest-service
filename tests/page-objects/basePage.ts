import { Page, expect } from '@playwright/test'
import { config, EnvironmentVariables } from '../configuration';

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page
  }

  async navigate(): Promise<void> {
    await this.page.goto(config.get(EnvironmentVariables.UI_BASE_URL));
  }

   async closeBrowser(): Promise<void>{
    await this.page.close()
  }
}

// removed

