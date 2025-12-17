import { type Locator, type Page } from '@playwright/test';
import { pageTitlesMap, RoutePath } from '../route-paths';
import { HTCPage } from './HTCPage';
import { type Config, ConfigFactory } from '../env/config';

export class OdsNhsNumberNotEligiblePage extends HTCPage {
  readonly config: Config;
  readonly odsNhsNotEligiblePageHeader: Locator;

  constructor(page: Page) {
    super(page);
    this.config = ConfigFactory.getConfig();
    this.odsNhsNotEligiblePageHeader = page.locator(
      'h1:has-text("Contact your GP surgery")'
    );
  }

  async waitUntilLoaded(): Promise<void> {
    await this.odsNhsNotEligiblePageHeader.waitFor();
  }

  async getHeaderText(): Promise<string | null> {
    return await this.odsNhsNotEligiblePageHeader.textContent();
  }

  async clickBackLink(): Promise<void> {
    return Promise.reject(new Error('Method not implemented.'));
  }

  getExpectedTitleHeading(): string {
    return pageTitlesMap[RoutePath.OdsNhsNumberNotEligiblePage];
  }

  async goToPageAndWaitForLoading(): Promise<void> {
    await this.page.goto(
      `${this.config.questionnaireAppURL}${RoutePath.OdsNhsNumberNotEligiblePage}`
    );
    await this.waitUntilLoaded();
  }
}
