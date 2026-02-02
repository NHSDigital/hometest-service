import { expect, Locator, Page } from '@playwright/test';

export class FindAddressPage {
  readonly postcodeInput: Locator;
  readonly numNameInput: Locator;
  readonly continueButton: Locator;
  readonly addressResults: Locator;
  readonly postcodeErrorMessage: Locator;
  readonly BuildingNoErrorMessage: Locator;
  readonly enterAddressManuallyLink: Locator;
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
    this.postcodeInput = page.locator('#postcode');
    this.numNameInput = page.locator('#building-number-or-name');
    this.continueButton = page.getByRole('button', { name: 'Continue' });
    this.addressResults = page.locator('.nhsuk-heading-l');
    this.postcodeErrorMessage = page.locator('#postcode--error-message');
    this.BuildingNoErrorMessage = page.locator('#building-number-or-name--error-message');
    this.enterAddressManuallyLink = page.locator("a[href='enter-address-manually']");
  }

  async fillPostCodeAndAddressAndContinue(postcode: string, firstLineAddress: string): Promise<void> {
    await this.postcodeInput.fill(postcode);
    await this.numNameInput.fill(firstLineAddress);
    await this.continueButton.click();
  }

  async waitUntilPageLoad(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
  }

  async clickEnterAddressManuallyLink(): Promise<void> {
    await this.enterAddressManuallyLink.click();
  }

}
