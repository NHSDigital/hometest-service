import { type Locator, type Page } from '@playwright/test';
import { JourneyStepNames, pageTitlesMap } from '../../route-paths';
import { HTCPage } from '../HTCPage';

export class CheckYourAnswersPage extends HTCPage {
  readonly changeReadingBloodPressureLink: Locator;
  readonly changeSystolicAndDiastolicLink: Locator;
  readonly systolicAndDiastolicValues: Locator;
  readonly lowBloodPressureSymptomsValues: Locator;
  readonly saveAndContinueButton: Locator;

  constructor(page: Page) {
    super(page);
    this.changeReadingBloodPressureLink = page
      .locator('#blood-how-changeLink')
      .getByRole('link');
    this.changeSystolicAndDiastolicLink = page
      .locator('#blood-reading-changeLink')
      .getByRole('link');
    this.saveAndContinueButton = page.getByRole('button', {
      name: 'Save and continue'
    });
    this.systolicAndDiastolicValues = page.locator('#blood-reading-value');
    this.lowBloodPressureSymptomsValues = page.locator(
      '#blood-pressure-symptoms-value'
    );
  }

  async waitUntilLoaded(): Promise<void> {
    await this.changeReadingBloodPressureLink.waitFor();
  }

  async clickChangeReadingBloodPressureLink(): Promise<void> {
    await this.changeReadingBloodPressureLink.click();
  }

  async clickChangeSystolicAndDiastolicLink(): Promise<void> {
    await this.changeSystolicAndDiastolicLink.click();
  }

  async getSystolicDiastolicValues(): Promise<string | null> {
    return await this.systolicAndDiastolicValues.textContent();
  }

  async getLowBloodPressureSymptomsValues(): Promise<string | null> {
    return await this.lowBloodPressureSymptomsValues.textContent();
  }

  async clickSaveAndContinueButton(): Promise<void> {
    await this.saveAndContinueButton.click();
  }

  async clickBackLink(): Promise<void> {
    return Promise.reject(new Error('Method not implemented.')); // TODO: looks this is not used yet
  }

  getExpectedTitleHeading(): string {
    return pageTitlesMap[JourneyStepNames.ConfirmBloodPressurePage];
  }
}
