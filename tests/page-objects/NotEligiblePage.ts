import { type Locator, type Page } from '@playwright/test';
import { pageTitlesMap, RoutePath } from '../route-paths';
import { HTCPage } from './HTCPage';

export class NotEligiblePage extends HTCPage {
  readonly notEligiblePageHeader: Locator;

  constructor(page: Page) {
    super(page);
    this.notEligiblePageHeader = page.locator(
      'h1:has-text("Sorry, you cannot get an NHS Health Check")'
    );
  }

  async waitUntilLoaded(): Promise<void> {
    await this.notEligiblePageHeader.waitFor();
  }

  async getHeaderText(): Promise<string | null> {
    return await this.notEligiblePageHeader.textContent();
  }

  async clickBackLink(): Promise<void> {
    return Promise.reject(new Error('Method not implemented.'));
  }

  getExpectedTitleHeading(): string {
    return pageTitlesMap[RoutePath.NotEligiblePage];
  }
}
