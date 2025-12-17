import { type Locator, type Page } from '@playwright/test';
import { JourneyStepNames, pageTitlesMap } from '../../route-paths';
import { HTCPage } from '../HTCPage';

export enum PreExistingOptions {
  YES = 'Yes',
  NO = 'No'
}

export class PreExistingHealthConditionsPage extends HTCPage {
  readonly yesRadioButton: Locator;
  readonly noRadioButton: Locator;
  readonly continueButton: Locator;
  readonly pageHeader: Locator;
  readonly selectionErrorLink: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.yesRadioButton = page
      .locator('div')
      .filter({ hasText: /^Yes$/ })
      .getByRole('radio');
    this.noRadioButton = page
      .locator('div')
      .filter({ hasText: /^No$/ })
      .getByRole('radio');
    this.continueButton = page.getByRole('button', { name: 'Continue' });
    this.pageHeader = page
      .locator('h1')
      .getByText('Pre-existing health conditions');
  }

  async selectPreExistingOptions(selection: PreExistingOptions): Promise<void> {
    if (selection === PreExistingOptions.YES) {
      await this.yesRadioButton.check();
    } else {
      await this.noRadioButton.check();
    }
  }

  async waitUntilLoaded(): Promise<void> {
    await this.pageHeader.waitFor();
  }

  async clickContinueButton(): Promise<void> {
    await this.continueButton.click();
  }

  async selectPreExistingOptionsAndClickContinue(
    selection: PreExistingOptions
  ): Promise<void> {
    await this.selectPreExistingOptions(selection);
    await this.clickContinueButton();
  }

  async clickBackLink(): Promise<void> {
    return Promise.reject(new Error('Method not implemented.'));
  }

  getExpectedTitleHeading(): string {
    return pageTitlesMap[JourneyStepNames.PreexistingHealthConditionsPage];
  }
}
