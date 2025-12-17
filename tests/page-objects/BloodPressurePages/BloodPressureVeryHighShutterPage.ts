import { type Locator, type Page } from '@playwright/test';
import { JourneyStepNames, pageTitlesMap } from '../../route-paths';
import { HTCPage } from '../HTCPage';

export class BloodPressureVeryHighShutterPage extends HTCPage {
  readonly backLink: Locator;

  async waitUntilLoaded(): Promise<void> {
    await this.page.waitForSelector(
      'h1:has-text("Your blood pressure reading is:")'
    );
  }

  constructor(page: Page) {
    super(page);
    this.backLink = page.getByRole('link', { name: 'Back' });
  }

  async clickBackLink(): Promise<void> {
    return Promise.reject(
      new Error('No back button on this page. Test needs to be updated.')
    );
  }

  async clickBackButtonOnBrowser(): Promise<void> {
    await this.page.goBack();
  }

  async getPageTittle(): Promise<string> {
    return await this.page.title();
  }

  getExpectedTitleHeading(): string {
    return pageTitlesMap[JourneyStepNames.BloodPressureVeryHighPage];
  }
}
