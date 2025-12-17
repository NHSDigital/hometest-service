import { type Locator, type Page } from '@playwright/test';
import { JourneyStepNames, pageTitlesMap } from '../../route-paths';
import { HTCPage } from '../HTCPage';
import { type Config, ConfigFactory } from '../../env/config';

export class EnterYourReadingPage extends HTCPage {
  readonly config: Config;
  readonly systolicInput: Locator;
  readonly diastolicInput: Locator;
  readonly continueButton: Locator;
  readonly backLink: Locator;
  readonly pageHeader: Locator;
  readonly systolicInputSelector: string = 'input#systolic-value';
  readonly systolicInputFieldErrorLink: Locator;
  readonly systolicErrorMessage: Locator;
  readonly systolicErrorMessageText: Locator;
  readonly diastolicInputFieldErrorLink: Locator;
  readonly diastolicErrorMessage: Locator;
  readonly iNeedHelpMeasuringInfo: Locator;
  readonly diastolicErrorMessageText: Locator;

  constructor(page: Page) {
    super(page);
    this.config = ConfigFactory.getConfig();
    this.systolicInput = page.locator(this.systolicInputSelector);
    this.diastolicInput = page.locator('input#diastolic-value');
    this.continueButton = page.locator('button:has-text("Continue")');
    this.systolicInputFieldErrorLink = page.getByRole('link', {
      name: 'Enter a systolic reading'
    });
    this.diastolicInputFieldErrorLink = page.getByRole('link', {
      name: 'Enter a diastolic reading'
    });
    this.iNeedHelpMeasuringInfo = page.getByText('I need help measuring my');
    this.systolicErrorMessageText = page.locator(
      '#systolic-value--error-message'
    );
    this.diastolicErrorMessageText = page.locator(
      '#diastolic-value--error-message'
    );
    this.pageHeader = page.locator('h1:has-text("Taking your blood pressure")');
    this.backLink = page.getByRole('link', { name: 'Back' });
  }

  async waitUntilLoaded(): Promise<void> {
    await this.pageHeader.waitFor();
  }

  async clickContinueButton(): Promise<void> {
    await this.continueButton.click();
  }

  async clickBackLink(): Promise<void> {
    await this.backLink.click();
  }

  async getSystolicErrorMessageText(): Promise<string | null> {
    return await this.systolicErrorMessageText.textContent();
  }

  async getDiastolicErrorMessageText(): Promise<string | null> {
    return await this.diastolicErrorMessageText.textContent();
  }

  async fillSystolicField(systolicValue: number): Promise<void> {
    await this.systolicInput.fill(systolicValue.toString());
  }

  async fillDiastolicField(diastolicValue: number): Promise<void> {
    await this.diastolicInput.fill(diastolicValue.toString());
  }

  async fillSystolicAndDiastolicValuesAndClickContinue(
    systolicValue: number,
    diastolicValue: number
  ): Promise<void> {
    await this.fillSystolicField(systolicValue);
    await this.fillDiastolicField(diastolicValue);
    await this.continueButton.click();
  }

  getExpectedTitleHeading(): string {
    return pageTitlesMap[JourneyStepNames.EnterBloodPressurePage];
  }

  async goToEnterYourReadingPage(): Promise<void> {
    await this.page.goto(
      `${this.config.questionnaireAppURL}/blood-pressure?step=enter-blood-pressure-reading`
    );
  }
}
