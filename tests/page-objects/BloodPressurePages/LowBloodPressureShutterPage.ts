import { type Locator, type Page } from '@playwright/test';
import { HTCPage } from '../HTCPage';
import { JourneyStepNames, pageTitlesMap } from '../../route-paths';

export class LowBloodPressureShutterPage extends HTCPage {
  readonly backLink: Locator;
  readonly pageHeader: Locator;

  constructor(page: Page) {
    super(page);
    this.pageHeader = page.locator(
      'h1:has-text("You cannot complete your NHS Health Check online")'
    );
    this.backLink = page.getByRole('link', { name: 'Back' });
  }

  async waitUntilLoaded(): Promise<void> {
    await this.pageHeader.waitFor();
  }

  async clickBackLink(): Promise<void> {
    await this.backLink.click();
  }

  async getPageHeaderText(): Promise<string | null> {
    return await this.pageHeader.textContent();
  }

  getExpectedTitleHeading(): string {
    return pageTitlesMap[JourneyStepNames.LowBloodPressureShutterPage];
  }
}
