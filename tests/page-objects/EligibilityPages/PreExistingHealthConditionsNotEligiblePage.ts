import { type Locator, type Page } from '@playwright/test';
import { JourneyStepNames, pageTitlesMap } from '../../route-paths';
import { HTCPage } from '../HTCPage';

export class PreExistingHealthConditionsNotEligiblePage extends HTCPage {
  readonly backLink: Locator;
  readonly expectedFeedbackSubtitle: Locator;
  readonly giveFeedbackButton: Locator;

  constructor(page: Page) {
    super(page);
    this.backLink = page.getByRole('link', { name: 'Back' });
    this.giveFeedbackButton = page.getByRole('button', {
      name: 'Give feedback'
    });
    this.expectedFeedbackSubtitle = page.getByRole('heading', {
      name: 'Help us improve this service'
    });
  }

  async waitUntilLoaded(): Promise<void> {
    await this.page.waitForSelector(
      'h1:has-text("Sorry, you cannot get an NHS Health Check right now")'
    );
  }

  async clickBackLink(): Promise<void> {
    await this.backLink.click();
  }

  async clickFeedbackButton(): Promise<void> {
    await this.giveFeedbackButton.click();
  }

  getExpectedTitleHeading(): string {
    return pageTitlesMap[
      JourneyStepNames.SorryCannotGetHealthCheckWithPreexistingConditionPage
    ];
  }
}
