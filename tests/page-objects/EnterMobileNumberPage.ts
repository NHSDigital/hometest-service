import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { PersonalDetails } from '../models/PersonalDetails';

export class EnterMobileNumberPage extends BasePage {
  readonly mobileNumberInput: Locator;
  readonly continueButton: Locator;

  constructor(page: Page) {
    super(page);
    this.mobileNumberInput = page.locator('#mobile-number');
    this.continueButton = page.getByRole('button', { name: 'Continue' });
  }

  async fillMobileNumberAndContinue(
    randomEntry: PersonalDetails
  ): Promise<void> {
    await this.mobileNumberInput.fill(randomEntry.mobileNumber);
    await this.continueButton.click();
  }
}
