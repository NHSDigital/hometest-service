import { type Locator, type Page } from '@playwright/test';
import { JourneyStepNames, pageTitlesMap } from '../../route-paths';
import { HTCPage } from '../HTCPage';

export class CheckBloodPressurePage extends HTCPage {
  readonly findPharmacyLink: Locator;
  readonly iCannotTakeBloodPressureLink: Locator;
  readonly continueButton: Locator;
  readonly backLink: Locator;
  readonly expectedFeedbackSubtitle: Locator;
  readonly giveFeedbackButton: Locator;

  constructor(page: Page) {
    super(page);
    this.findPharmacyLink = page.getByText(
      'Find a pharmacy that offers free blood pressure checks (opens in new tab)'
    );
    this.iCannotTakeBloodPressureLink = page.getByText(
      'I cannot take my blood pressure reading'
    );
    this.continueButton = page.getByRole('button', { name: 'Continue' });
    this.backLink = page.getByRole('link', { name: 'Back' });
    this.giveFeedbackButton = page.getByRole('button', {
      name: 'Give feedback'
    });
    this.expectedFeedbackSubtitle = page.getByRole('heading', {
      name: 'Help us improve this service'
    });
  }

  async clickContinueButton(): Promise<void> {
    await this.continueButton.click();
  }

  async clickBackLink(): Promise<void> {
    await this.backLink.click();
  }

  async clickICannotTakeBloodPressureLink(): Promise<void> {
    await this.iCannotTakeBloodPressureLink.click();
  }

  async clickFindPharmacyLink(): Promise<void> {
    await this.findPharmacyLink.click();
  }

  async waitUntilLoaded(): Promise<void> {
    await this.iCannotTakeBloodPressureLink.waitFor();
  }

  async clickFeedbackButton(): Promise<void> {
    await this.giveFeedbackButton.click();
  }

  getExpectedTitleHeading(): string {
    return pageTitlesMap[JourneyStepNames.BloodPressureCheckPage];
  }
}
