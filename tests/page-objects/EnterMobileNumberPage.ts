import { Locator, Page} from '@playwright/test';
import { ConfigFactory, type ConfigInterface } from '../configuration/configuration';
import { BasePage } from './BasePage';
import { AddressModel } from '../models';

export class EnterMobileNumberPage extends BasePage 
{
  readonly mobileNumberInput: Locator;  
  readonly continueButton: Locator;

  constructor(page: Page) {
    super(page);
    this.mobileNumberInput = page.locator('#mobile-number');
    this.continueButton = page.getByRole('button', { name: 'Continue' });
  }

  async fillMobileNumberAndContinue(randomEntry: AddressModel): Promise<void> {
    await this.mobileNumberInput.fill(randomEntry.mobileNumber);        
    await this.continueButton.click();
  }
}