import { type Locator, type Page } from '@playwright/test';
import { ConfigFactory, type Config } from '../env/config';
import { pageTitlesMap, RoutePath } from '../route-paths';
import { HTCPage } from './HTCPage';

export class ConsentNotGivenErrorPage extends HTCPage {
  readonly pageHeader: Locator;
  readonly config: Config;

  constructor(page: Page) {
    super(page);
    this.pageHeader = page.locator('h1:has-text("Contact your GP surgery")');
    this.config = ConfigFactory.getConfig();
  }

  async waitUntilLoaded(): Promise<void> {
    await this.pageHeader.waitFor();
  }

  async getHeaderText(): Promise<string | null> {
    return await this.pageHeader.textContent();
  }

  async clickBackLink(): Promise<void> {
    return Promise.reject(new Error('Method not implemented.'));
  }

  getExpectedTitleHeading(): string {
    return pageTitlesMap[RoutePath.ConsentNotGivenErrorPage];
  }
}
