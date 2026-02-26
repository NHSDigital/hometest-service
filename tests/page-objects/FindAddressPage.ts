import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { Address } from '../models/Address';

export class FindAddressPage extends BasePage {
  readonly postcodeInput: Locator;
  readonly numNameInput: Locator;
  readonly continueButton: Locator;
  readonly addressResults: Locator;
  readonly postcodeErrorMessage: Locator;
  readonly buildingNoErrorMessage: Locator;
  readonly enterAddressManuallyLink: Locator;

  constructor(page: Page) {
    super(page);
    this.postcodeInput = page.locator('#postcode');
    this.numNameInput = page.locator('#building-number-or-name');
    this.continueButton = page.getByRole('button', { name: 'Continue' });
    this.addressResults = page.locator('.nhsuk-heading-l');
    this.postcodeErrorMessage = page.locator('#postcode--error-message');
    this.buildingNoErrorMessage = page.locator(
      '#building-number-or-name--error-message'
    );
    this.enterAddressManuallyLink = page.getByText('Enter address manually');
  }

  async fillPostCodeAndAddressAndContinue(
    deliveryAddress: Address
  ): Promise<void> {
    await this.postcodeInput.fill(deliveryAddress.postcode);
    await this.numNameInput.fill(deliveryAddress.addressLine1);
    await this.continueButton.click();
  }

  async clickEnterAddressManuallyLink(): Promise<void> {
    await this.enterAddressManuallyLink.click();
  }

  async getPostcodeAndAddressValues(): Promise<{
    postcode: string;
    firstLineAddress: string;
  }> {
    const postcodeValue = await this.postcodeInput.inputValue();
    const firstLineAddressValue = await this.numNameInput.inputValue();
    return { postcode: postcodeValue, firstLineAddress: firstLineAddressValue };
  }
}
