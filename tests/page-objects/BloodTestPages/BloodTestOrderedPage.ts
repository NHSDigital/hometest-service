import { type Locator, type Page } from '@playwright/test';
import { JourneyStepNames, pageTitlesMap } from '../../route-paths';
import { HTCPage } from '../HTCPage';

export class BloodTestOrderedPage extends HTCPage {
  readonly pageHeader: Locator;
  readonly addressSummary: Locator;
  readonly expectedFeedbackSubtitle: Locator;
  readonly giveFeedbackButton: Locator;

  constructor(page: Page) {
    super(page);
    this.pageHeader = page.locator(
      'h1:has-text("Your blood test kit has been ordered")'
    );
    this.addressSummary = page.locator(
      '.nhsuk-inset-text.nhsuk-u-margin-bottom-5.nhsuk-u-margin-top-4 > p'
    );
    this.giveFeedbackButton = page.getByRole('button', {
      name: 'Give feedback'
    });
    this.expectedFeedbackSubtitle = page.getByRole('heading', {
      name: 'Help us improve this service'
    });
  }

  async waitUntilLoaded(): Promise<void> {
    await this.pageHeader.waitFor();
  }

  async getAddressSummaryText(): Promise<string | null> {
    return await this.addressSummary.textContent();
  }

  async clickBackLink(): Promise<void> {
    return Promise.reject(new Error('Method not implemented.'));
  }

  async clickFeedbackButton(): Promise<void> {
    await this.giveFeedbackButton.click();
  }

  getExpectedTitleHeading(): string {
    return pageTitlesMap[JourneyStepNames.BloodTestOrderedPage];
  }
}
