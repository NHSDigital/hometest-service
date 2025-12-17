import { type Locator, type Page } from '@playwright/test';
import { HTCPage } from '../HTCPage';
import { JourneyStepNames, pageTitlesMap } from '../../route-paths';

export enum ConfirmBloodPressureValueOptions {
  Yes = "Yes, it's correct",
  No = 'No, I need to change it'
}

export class ConfirmBloodPressureReadingsPage extends HTCPage {
  readonly backLink: Locator;
  readonly yesRadioButton: Locator;
  readonly noRadioButton: Locator;
  readonly continueButton: Locator;
  readonly bloodPressureSelectionErrorLink: Locator;
  readonly errorMessage: Locator;
  readonly pageHeader: Locator;

  constructor(page: Page) {
    super(page);
    this.yesRadioButton = page
      .locator('div')
      .filter({
        hasText: /^Yes, it's correct$/
      })
      .getByRole('radio');
    this.noRadioButton = page
      .locator('div')
      .filter({
        hasText: /^No, I need to change it$/
      })
      .getByRole('radio');
    this.backLink = page.getByRole('link', { name: 'Back' });
    this.bloodPressureSelectionErrorLink = page.getByRole('link', {
      name: 'Select yes if your blood pressure reading is correct'
    });
    this.errorMessage = page.getByText(
      'Error: Select yes if your blood pressure reading is correct'
    );
    this.continueButton = page.getByRole('button', { name: 'Continue' });
    this.pageHeader = page.locator(
      `h1:has-text("You told us your blood pressure reading is")`
    );
  }

  async waitUntilLoaded(): Promise<void> {
    await this.pageHeader.waitFor();
  }

  async getPageHeaderText(): Promise<string | null> {
    return await this.pageHeader.textContent();
  }

  async clickContinueButton(): Promise<void> {
    await this.continueButton.click();
  }

  async clickBackLink(): Promise<void> {
    await this.backLink.click();
  }

  async selectBloodPressureValueOptions(
    selection: ConfirmBloodPressureValueOptions
  ): Promise<void> {
    if (selection === ConfirmBloodPressureValueOptions.Yes) {
      await this.yesRadioButton.check();
    } else {
      await this.noRadioButton.check();
    }
  }

  async selectConfirmBloodPressureValueOptionsAndClickContinue(
    selection: ConfirmBloodPressureValueOptions
  ): Promise<void> {
    await this.selectBloodPressureValueOptions(selection);
    await this.clickContinueButton();
  }

  getExpectedTitleHeading(): string {
    return pageTitlesMap[JourneyStepNames.ConfirmBloodPressureReadingPage];
  }
}
