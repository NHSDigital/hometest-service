import { type Locator, type Page } from '@playwright/test';
import { JourneyStepNames, pageTitlesMap } from '../../route-paths';
import { HTCPage } from '../HTCPage';

export enum HaveYouCompletedOptions {
  YES = 'Yes',
  NO = 'No'
}

export class HaveYouCompletedNhsHealthCheckPage extends HTCPage {
  readonly backLink: Locator;
  readonly continueButton: Locator;
  readonly radioButtonYes: Locator;
  readonly radioButtonNo: Locator;
  readonly pageHeader: Locator;
  readonly selectionErrorLink: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.backLink = page.getByRole('link', { name: 'Back' });
    this.continueButton = page.locator('button:has-text("Continue")');
    this.radioButtonYes = page.locator('#preexisting-condition-1');
    this.radioButtonNo = page.locator('#preexisting-condition-2');
    this.pageHeader = page.locator(
      'h1:has-text("Have you completed an NHS Health Check in the last 5 years?")'
    );
  }

  async clickBackLink(): Promise<void> {
    await this.backLink.click();
  }

  async clickContinueButton(): Promise<void> {
    await this.continueButton.click();
  }

  async waitUntilLoaded(): Promise<void> {
    await this.pageHeader.waitFor();
  }

  async selectOptionAndClickContinue(
    selection: HaveYouCompletedOptions
  ): Promise<void> {
    if (selection === HaveYouCompletedOptions.YES) {
      await this.radioButtonYes.check();
    } else {
      await this.radioButtonNo.check();
    }
    await this.clickContinueButton();
  }

  getExpectedTitleHeading(): string {
    return pageTitlesMap[
      JourneyStepNames.PreviousHealthCheckCompletedQueryPage
    ];
  }
}
