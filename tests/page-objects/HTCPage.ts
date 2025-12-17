import { type Locator, type Page } from '@playwright/test';

export abstract class HTCPage {
  protected readonly page: Page;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.logoutButton = page.locator('button:has-text("Log out")');
  }

  getPage(): Page {
    return this.page;
  }

  getExpectedTitle(): string {
    return `${this.getExpectedTitleHeading()} - NHS Health Check online - NHS`;
  }

  getExpectedErrorTitle(): string {
    return `Error: ${this.getExpectedTitle()}`;
  }

  async clickLogoutButton(): Promise<void> {
    await this.logoutButton.click();
  }

  abstract waitUntilLoaded(): Promise<void>;
  abstract clickBackLink(): Promise<void>;
  abstract getExpectedTitleHeading(): string;
}
