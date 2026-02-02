import { expect, Locator, Page } from '@playwright/test';

export class EnterAddressManuallyPage {
  readonly addressLine1Input: Locator;
  readonly addressLine2Input: Locator;
  readonly addressLine3Input: Locator;
  readonly addressTownInput: Locator;
  readonly postcodeInput: Locator;
  readonly continueButton: Locator;
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
    this.addressLine1Input = page.locator('#address-line-1');
    this.addressLine2Input = page.locator('#address-line-2');
    this.addressLine3Input = page.locator('#address-line-3');
    this.addressTownInput = page.locator('#address-town');
    this.postcodeInput = page.locator('#postcode');
    this.continueButton = page.getByRole('button', { name: 'Continue' });
  }

  async fillAddressAndContinue(addressLine1: string, addressLine2: string, addressLine3: string, addressTown: string, postcode: string): Promise<void> {
    await this.addressLine1Input.fill(addressLine1);
    await this.addressLine2Input.fill(addressLine2);
    await this.addressLine3Input.fill(addressLine3);
    await this.addressTownInput.fill(addressTown);
    await this.postcodeInput.fill(postcode);
    await this.continueButton.click();
  }


}
