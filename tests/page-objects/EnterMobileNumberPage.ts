import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { PersonalDetails } from '../models/PersonalDetails';

export class EnterMobileNumberPage extends BasePage {
  readonly mobileNumberInput: Locator;
  readonly continueButton: Locator;
  readonly useAnotherNumberButton: Locator;
  readonly alternativeMobileNumberInput: Locator;

  constructor(page: Page) {
    super(page);
    this.mobileNumberInput = page.locator('#mobile-number');
    this.continueButton = page.getByRole('button', { name: 'Continue' });
    this.useAnotherNumberButton = page.locator('#phone-confirmation-2');
    this.alternativeMobileNumberInput = page.locator(
      '#alternative-mobile-number'
    );
  }

  async fillMobileNumberAndContinue(
    personalDetails: PersonalDetails
  ): Promise<void> {
    await this.mobileNumberInput.fill(personalDetails.mobileNumber);
    await this.continueButton.click();
  }

  async fillAlternativeMobileNumberAndContinue(
    personalDetails: PersonalDetails
  ): Promise<void> {
    await this.useAnotherNumberButton.click();
    await this.alternativeMobileNumberInput.fill(personalDetails.mobileNumber);
    await this.continueButton.click();
  }

  async clickUseAnotherNumber(): Promise<void> {
    await this.useAnotherNumberButton.click();
  }
}
