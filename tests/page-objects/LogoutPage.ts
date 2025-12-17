import { type Locator, type Page } from 'playwright';
import { pageTitlesMap, RoutePath } from '../route-paths';
import { HTCPage } from './HTCPage';

export class LogoutPage extends HTCPage {
  readonly continueButton: Locator;
  readonly pageHeader: Locator;

  constructor(page: Page) {
    super(page);
    this.continueButton = page.locator('button:has-text("Continue")');
    this.pageHeader = page.locator('h1:has-text("You have logged out")');
  }

  async waitUntilLoaded(): Promise<void> {
    await this.pageHeader.waitFor();
  }

  async clickContinueButton(): Promise<void> {
    await this.continueButton.click();
  }

  async getHeaderText(): Promise<string | null> {
    return await this.pageHeader.textContent();
  }

  async clickBackLink(): Promise<void> {
    return Promise.reject(new Error('Method not implemented.'));
  }

  getExpectedTitleHeading(): string {
    return pageTitlesMap[RoutePath.LogoutPage];
  }
}
