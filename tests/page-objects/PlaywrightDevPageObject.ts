import { Page, Locator } from '@playwright/test';

export class PlaywrightDevPage {
  readonly page: Page;
  readonly url: string = 'https://playwright.dev/';

  // Locators
  readonly getStartedLink: Locator;
  readonly installationHeading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.getStartedLink = page.getByRole('link', { name: 'Get started' });
    this.installationHeading = page.getByRole('heading', { name: 'Installation' });
  }

  async navigate(): Promise<void> {
    await this.page.goto(this.url);
  }

  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  async clickGetStarted(): Promise<void> {
    await this.getStartedLink.click();
  }

  async isInstallationHeadingVisible(): Promise<boolean> {
    return await this.installationHeading.isVisible();
  }
}
