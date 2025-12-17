import { type Locator, type Page } from '@playwright/test';
import { JourneyStepNames, pageTitlesMap } from '../../route-paths';
import { HTCPage } from '../HTCPage';
import { BloodPressureLocation } from '../../lib/enum/health-check-answers';

export class ConfirmBloodPressureLocationPage extends HTCPage {
  readonly healthcareProfessionalRadioButton: Locator;
  readonly atHomeRadioButton: Locator;
  readonly continueButton: Locator;
  readonly bloodPressureSelectionErrorLink: Locator;
  readonly errorMessage: Locator;
  readonly pageHeader: Locator;
  readonly backLink: Locator;

  constructor(page: Page) {
    super(page);
    this.healthcareProfessionalRadioButton = page
      .locator('div')
      .filter({
        hasText: /^At a clinic or pharmacy by a healthcare professional$/
      })
      .getByRole('radio');
    this.atHomeRadioButton = page
      .locator('div')
      .filter({ hasText: /^With a monitor at home$/ })
      .getByRole('radio');
    this.continueButton = page.getByRole('button', { name: 'Continue' });
    this.bloodPressureSelectionErrorLink = page.getByRole('link', {
      name: 'Select how you will take your blood pressure reading'
    });
    this.errorMessage = page.getByText(
      'Error: Select how you will take your blood pressure reading'
    );
    this.pageHeader = page.locator(
      'h1:has-text("Confirm where you will get a blood pressure reading")'
    );
    this.backLink = page.getByRole('link', { name: 'Back' });
  }

  async waitUntilLoaded(): Promise<void> {
    await this.pageHeader.waitFor();
  }

  async selectBloodPressureOptions(
    selection: BloodPressureLocation
  ): Promise<void> {
    if (selection === BloodPressureLocation.Pharmacy) {
      await this.healthcareProfessionalRadioButton.check();
    } else {
      await this.atHomeRadioButton.check();
    }
  }

  async clickContinueButton(): Promise<void> {
    await this.continueButton.click();
  }

  async selectBloodPressureOptionsAndClickContinue(
    selection: BloodPressureLocation
  ): Promise<void> {
    await this.selectBloodPressureOptions(selection);
    await this.clickContinueButton();
  }

  async clickBackLink(): Promise<void> {
    await this.backLink.click();
  }

  getExpectedTitleHeading(): string {
    return pageTitlesMap[JourneyStepNames.BloodPressureLocationPage];
  }
}
