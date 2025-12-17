import { type Locator, type Page } from '@playwright/test';
import { pageTitlesMap, RoutePath } from '../route-paths';
import { HTCPage } from './HTCPage';

export class AboutThisSoftwarePage extends HTCPage {
  readonly pageHeader: Locator;
  readonly backLink: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    super(page);
    this.pageHeader = page.locator('h1:has-text("About this software")');
    this.backLink = page.getByRole('link', { name: 'Back' });
    this.backButton = page.getByRole('button', { name: 'Go back' });
  }

  async waitUntilLoaded(): Promise<void> {
    await this.backButton.waitFor();
  }
  async clickBackLink(): Promise<void> {
    await this.backLink.click();
  }

  async clickBackButton(): Promise<void> {
    await this.backButton.click();
  }

  getExpectedTitleHeading(): string {
    return pageTitlesMap[RoutePath.AboutThisSoftwarePage];
  }
}
