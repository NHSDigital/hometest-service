import { type Locator, type Page } from '@playwright/test';
import { JourneyStepNames, pageTitlesMap } from '../../route-paths';
import { HTCPage } from '../HTCPage';

export enum NeedToLeaveTheOnlineServiceOptions {
  YES = 'Yes',
  NO = 'No'
}

export class WhoShouldNotUseThisOnlineServicePage extends HTCPage {
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
    this.radioButtonYes = page.getByLabel('Yes');
    this.radioButtonNo = page.getByLabel('No');
    this.pageHeader = page.locator(
      'h1:has-text("Who should not use this online service")'
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
    selection: NeedToLeaveTheOnlineServiceOptions
  ): Promise<void> {
    if (selection === NeedToLeaveTheOnlineServiceOptions.YES) {
      await this.radioButtonYes.check();
    } else {
      await this.radioButtonNo.check();
    }
    await this.clickContinueButton();
  }

  getExpectedTitleHeading(): string {
    return pageTitlesMap[JourneyStepNames.WhoShouldNotUseThisOnlineServicePage];
  }
}
