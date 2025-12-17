import { type Locator, type Page } from '@playwright/test';
import { HTCPage } from '../HTCPage';
import { pageTitlesMap, JourneyStepNames } from '../../route-paths';

interface Selectors {
  pageHeader: Locator;
  backLink: Locator;
}

export class DiabetesShutterPage extends HTCPage {
  readonly page: Page;
  private readonly selectors: Selectors;

  constructor(page: Page) {
    super(page);
    this.page = page;
    this.selectors = {
      backLink: page.getByRole('link', { name: 'Back' }),
      pageHeader: page.locator(
        'h1:has-text("Book a face-to-face appointment with your GP surgery")'
      )
    };
  }

  async clickBackLink(): Promise<void> {
    return Promise.reject(
      new Error('No back button on this page. Test needs to be updated.')
    );
  }

  async getHeaderText(): Promise<string | null> {
    return await this.selectors.pageHeader.textContent();
  }

  async waitUntilLoaded(): Promise<void> {
    await this.selectors.pageHeader.waitFor();
  }

  getExpectedTitleHeading(): string {
    return pageTitlesMap[JourneyStepNames.DiabetesShutterPage];
  }
}
