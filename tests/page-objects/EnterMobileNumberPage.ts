import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { PersonalDetails } from '../models/PersonalDetails';

export class EnterMobileNumberPage extends BasePage {
  readonly mobileNumberInput: Locator;
  readonly continueButton: Locator;
  readonly useAnotherNumberButton: Locator;
  readonly alternativeMobileNumberInput: Locator;
  private mobileNumber: string | null = null;

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
    this.mobileNumber = personalDetails.mobileNumber;
    await this.mobileNumberInput.fill(this.mobileNumber);
    await this.continueButton.click();
  }

  async fillAlternativeMobileNumber(
    personalDetails: PersonalDetails
  ): Promise<void> {
    await this.useAnotherNumberButton.click();
    this.mobileNumber = personalDetails.mobileNumber;
    await this.alternativeMobileNumberInput.fill(this.mobileNumber);
  }

  async clickContinue(): Promise<void> {
    await this.continueButton.click();
  }


  async clickUseAnotherNumber(): Promise<void> {
    await this.useAnotherNumberButton.click();
  }

  async getMobileNumberInputValue(): Promise<string> {
    const mobileNumber = this.mobileNumber ?? '';
    return mobileNumber;
  }
}
