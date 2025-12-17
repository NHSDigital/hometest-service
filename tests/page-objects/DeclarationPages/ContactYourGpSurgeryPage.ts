import { type Locator, type Page } from '@playwright/test';
import { JourneyStepNames, pageTitlesMap } from '../../route-paths';
import { HTCPage } from '../HTCPage';

export class ContactYourGpSurgeryPage extends HTCPage {
  readonly pageHeader: Locator;
  readonly backLink: Locator;
  readonly expectedFeedbackSubtitle: Locator;
  readonly giveFeedbackButton: Locator;

  constructor(page: Page) {
    super(page);
    this.pageHeader = page.getByText(
      'Contact your GP surgery to complete your NHS Health Check'
    );
    this.giveFeedbackButton = page.getByRole('button', {
      name: 'Give feedback'
    });
    this.expectedFeedbackSubtitle = page.getByRole('heading', {
      name: 'Help us improve this service'
    });
    this.backLink = page.getByRole('link', { name: 'Back' });
  }

  async waitUntilLoaded(): Promise<void> {
    await this.pageHeader.waitFor();
  }

  async clickBackLink(): Promise<void> {
    await this.backLink.click();
  }

  async clickFeedbackButton(): Promise<void> {
    await this.giveFeedbackButton.click();
  }

  getExpectedTitleHeading(): string {
    return pageTitlesMap[JourneyStepNames.ContactHealthCheckPage];
  }
}
