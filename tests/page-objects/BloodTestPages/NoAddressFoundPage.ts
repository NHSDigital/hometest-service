import { type Locator, type Page } from '@playwright/test';
import { JourneyStepNames, pageTitlesMap } from '../../route-paths';
import { HTCPage } from '../HTCPage';

export class NoAddressFoundPage extends HTCPage {
  readonly pageHeader: Locator;
  readonly backLink: Locator;

  constructor(page: Page) {
    super(page);
    this.pageHeader = page.locator('h1:has-text("No address found")');
    this.backLink = page.getByRole('link', { name: 'Back' });
  }

  async waitUntilLoaded(): Promise<void> {
    await this.pageHeader.waitFor();
  }

  async clickBackLink(): Promise<void> {
    await this.backLink.click();
  }

  getExpectedTitleHeading(): string {
    return pageTitlesMap[JourneyStepNames.NoAddressFoundPage];
  }
}
