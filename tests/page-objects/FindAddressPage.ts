import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

type addressEntry = {
  postcode: string;
  addressline1: string;
};

export class FindAddressPage extends BasePage {
  readonly postcodeInput: Locator;
  readonly numNameInput: Locator;
  readonly continueButton: Locator;
  readonly addressResults: Locator;
  readonly postcodeErrorMessage: Locator;
  readonly BuildingNoErrorMessage: Locator;
  readonly enterAddressManuallyLink: Locator;

  constructor(page: Page) {
    super(page);
    this.postcodeInput = page.locator('#postcode');
    this.numNameInput = page.locator('#building-number-or-name');
    this.continueButton = page.getByRole('button', { name: 'Continue' });
    this.addressResults = page.locator('.nhsuk-heading-l');
    this.postcodeErrorMessage = page.locator('#postcode--error-message');
    this.BuildingNoErrorMessage = page.locator('#building-number-or-name--error-message');
    this.enterAddressManuallyLink = page.locator("a[href='enter-address-manually']");
  }

  async fillPostCodeAndAddressAndContinue(randomEntry: addressEntry): Promise<void> {
    await this.postcodeInput.fill(randomEntry.postcode);
    await this.numNameInput.fill(randomEntry.addressline1);
    await this.continueButton.click();
  }

  async clickEnterAddressManuallyLink(): Promise<void> {
    await this.enterAddressManuallyLink.click();
  }

  async getPostcodeAndAddressValues(): Promise<{ postcode: string, firstLineAddress: string }> {
    const postcodeValue = await this.postcodeInput.inputValue();
    const firstLineAddressValue = await this.numNameInput.inputValue();
    return { postcode: postcodeValue, firstLineAddress: firstLineAddressValue };
  }

}
