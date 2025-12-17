import { type Locator, type Page } from '@playwright/test';
import { JourneyStepNames, pageTitlesMap } from '../../route-paths';
import { HTCPage } from '../HTCPage';

export class ContactYourGPSurgeryAboutYourNHSHealthCheckPage extends HTCPage {
  readonly backLink: Locator;
  readonly pageHeader: Locator;
  readonly expectedFeedbackSubtitle: Locator;
  readonly giveFeedbackButton: Locator;

  constructor(page: Page) {
    super(page);
    this.backLink = page.getByRole('link', { name: 'Back' });
    this.pageHeader = page.locator(
      'h1:has-text("Book a face-to-face appointment with your GP surgery")'
    );
    this.giveFeedbackButton = page.getByRole('button', {
      name: 'Give feedback'
    });
    this.expectedFeedbackSubtitle = page.getByRole('heading', {
      name: 'Help us improve this service'
    });
  }

  async clickBackLink(): Promise<void> {
    await this.backLink.click();
  }

  async waitUntilLoaded(): Promise<void> {
    await this.pageHeader.waitFor();
  }

  async clickFeedbackButton(): Promise<void> {
    await this.giveFeedbackButton.click();
  }

  getExpectedTitleHeading(): string {
    return pageTitlesMap[
      JourneyStepNames.ContactYourGPSurgeryAboutYourNHSHealthCheckPage
    ];
  }
}
