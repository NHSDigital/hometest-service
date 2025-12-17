import { type Locator, type Page } from '@playwright/test';
import { JourneyStepNames, pageTitlesMap } from '../../route-paths';
import { HTCPage } from '../HTCPage';
import { type Config, ConfigFactory } from '../../env/config';

export enum LowBloodPressureSymptomOptions {
  Yes = 'Yes, I do',
  No = 'No, I do not'
}

export class LowBloodPressureSymptomsPage extends HTCPage {
  readonly config: Config;
  readonly continueButton: Locator;
  readonly backLink: Locator;
  readonly pageHeader: Locator;
  readonly yesRadioButton: Locator;
  readonly noRadioButton: Locator;
  readonly bloodPressureSelectionErrorLink: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.config = ConfigFactory.getConfig();
    this.yesRadioButton = page
      .locator('div')
      .filter({
        hasText: /^Yes, I do$/
      })
      .getByRole('radio');
    this.noRadioButton = page
      .locator('div')
      .filter({
        hasText: /^No, I do not$/
      })
      .getByRole('radio');
    this.pageHeader = page.locator(
      'h1:has-text("Do you have symptoms of fainting or dizziness?")'
    );
    this.backLink = page.getByRole('link', { name: 'Back' });
    this.bloodPressureSelectionErrorLink = page.getByRole('link', {
      name: 'Select yes if you have symptoms of fainting or dizziness'
    });
    this.errorMessage = page.getByText(
      'Error: Select yes if you have symptoms of fainting or dizziness'
    );
    this.continueButton = page.getByRole('button', { name: 'Continue' });
  }

  async waitUntilLoaded(): Promise<void> {
    await this.pageHeader.waitFor();
  }

  async clickContinueButton(): Promise<void> {
    await this.continueButton.click();
  }

  async clickBackLink(): Promise<void> {
    return Promise.reject(
      new Error('No back button on this page. Test needs to be updated.')
    );
  }

  async selectLowBloodPressureSymptomOptions(
    selection: LowBloodPressureSymptomOptions
  ): Promise<void> {
    if (selection === LowBloodPressureSymptomOptions.Yes) {
      await this.yesRadioButton.check();
    } else {
      await this.noRadioButton.check();
    }
  }

  async selectLowBloodPressureSymptomOptionsAndClickContinue(
    selection: LowBloodPressureSymptomOptions
  ): Promise<void> {
    await this.selectLowBloodPressureSymptomOptions(selection);
    await this.clickContinueButton();
  }

  getExpectedTitleHeading(): string {
    return pageTitlesMap[JourneyStepNames.LowBloodPressureSymptomsPage];
  }

  async goToLowBloodPressureSymptomsPage(): Promise<void> {
    await this.page.goto(
      `${this.config.questionnaireAppURL}/blood-pressure?step=low-blood-pressure-symptoms`
    );
  }
}
