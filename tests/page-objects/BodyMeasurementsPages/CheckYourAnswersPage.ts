import { type Locator, type Page } from '@playwright/test';
import { pageTitlesMap } from '../../route-paths';
import { JourneyStepNames } from '../../../ui/src/lib/models/route-paths';
import { HTCPage } from '../HTCPage';

interface Selectors {
  changeHeightLink: Locator;
  changeWeightLink: Locator;
  saveContinueButton: Locator;
  pageHeader: Locator;
}

export class CheckYourAnswersPage extends HTCPage {
  private readonly selectors: Selectors;

  constructor(page: Page) {
    super(page);
    this.selectors = {
      changeHeightLink: page
        .locator('div')
        .filter({ hasText: 'What is your height' })
        .getByRole('link'),
      changeWeightLink: page
        .locator('div')
        .filter({ hasText: 'What is your weight' })
        .getByRole('link'),
      saveContinueButton: page.locator('button:has-text("Save and continue")'),
      pageHeader: page.locator('h1:has-text("Check your answers")')
    };
  }

  async clickChangeHeightLink(): Promise<void> {
    await this.selectors.changeHeightLink.click();
  }

  async clickChangeWeightLink(): Promise<void> {
    await this.selectors.changeWeightLink.click();
  }

  async clickSaveContinueButton(): Promise<void> {
    await this.selectors.saveContinueButton.click();
  }

  async getHeaderText(): Promise<string | null> {
    return await this.selectors.pageHeader.textContent();
  }

  async clickBackLink(): Promise<void> {
    return Promise.reject(new Error('Method not implemented.'));
  }

  async waitUntilLoaded(): Promise<void> {
    await this.selectors.pageHeader.waitFor();
  }

  getExpectedTitleHeading(): string {
    return pageTitlesMap[JourneyStepNames.CheckYourAnswersBodyMeasurementsPage];
  }
}
