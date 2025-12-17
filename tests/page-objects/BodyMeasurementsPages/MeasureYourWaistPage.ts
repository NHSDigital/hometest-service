import { type Locator, type Page } from '@playwright/test';
import { pageTitlesMap, JourneyStepNames } from '../../route-paths';
import { HTCPage } from '../HTCPage';

interface Selectors {
  continueButton: Locator;
  pageHeader: Locator;
  backLink: Locator;
}

export class MeasureYourWaistPage extends HTCPage {
  private readonly selectors: Selectors;

  constructor(page: Page) {
    super(page);
    this.selectors = {
      backLink: page.getByRole('link', { name: 'Back' }),
      continueButton: page.locator('button:has-text("Continue")'),
      pageHeader: page.locator('h1:has-text("Measure your waist")')
    };
  }

  async clickBackLink(): Promise<void> {
    await this.selectors.backLink.click();
  }

  async clickContinueButton(): Promise<void> {
    await this.selectors.continueButton.click();
  }

  async getHeaderText(): Promise<string | null> {
    return await this.selectors.pageHeader.textContent();
  }

  async waitUntilLoaded(): Promise<void> {
    await this.selectors.pageHeader.waitFor();
  }

  getExpectedTitleHeading(): string {
    return pageTitlesMap[JourneyStepNames.MeasureYourWaistPage];
  }
}
