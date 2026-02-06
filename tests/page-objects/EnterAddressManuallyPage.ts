import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class EnterAddressManuallyPage extends BasePage {
  readonly addressLine1Input: Locator;
  readonly addressLine2Input: Locator;
  readonly addressLine3Input: Locator;
  readonly addressTownInput: Locator;
  readonly postcodeInput: Locator;
  readonly continueButton: Locator;

  constructor(page: Page) {
    super(page);
    this.addressLine1Input = page.locator('#address-line-1');
    this.addressLine2Input = page.locator('#address-line-2');
    this.addressLine3Input = page.locator('#address-line-3');
    this.addressTownInput = page.locator('#address-town');
    this.postcodeInput = page.locator('#postcode');
    this.continueButton = page.getByRole('button', { name: 'Continue' });
  }

  async fillAddressAndContinue(randomEntry: { addressline1: string; addressline2: string; addressline3: string; towncity: string; postcode: string; }): Promise<void> {
    await this.addressLine1Input.fill(randomEntry.addressline1);
    await this.addressLine2Input.fill(randomEntry.addressline2);
    await this.addressLine3Input.fill(randomEntry.addressline3);
    await this.addressTownInput.fill(randomEntry.towncity);
    await this.postcodeInput.fill(randomEntry.postcode);
    await this.continueButton.click();
  }


}
