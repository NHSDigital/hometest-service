import type { Locator, Page } from '@playwright/test';
import { HTCPage } from '../HTCPage';
import { pageTitlesMap, JourneyStepNames } from '../../route-paths';

export enum ReceivedInvitationOptions {
  YES = 'Yes',
  NO = 'No'
}

export class ReceivedInvitationQueryPage extends HTCPage {
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
    this.radioButtonYes = page.locator('#has-been-invited-1');
    this.radioButtonNo = page.locator('#has-been-invited-2');
    this.pageHeader = page.locator(
      'h1:has-text("Did you receive an invitation from your GP surgery")'
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
    selection: ReceivedInvitationOptions
  ): Promise<void> {
    if (selection === ReceivedInvitationOptions.YES) {
      await this.radioButtonYes.check();
    } else {
      await this.radioButtonNo.check();
    }
    await this.clickContinueButton();
  }

  getExpectedTitleHeading(): string {
    return pageTitlesMap[JourneyStepNames.ReceivedInvitationQueryPage];
  }
}
