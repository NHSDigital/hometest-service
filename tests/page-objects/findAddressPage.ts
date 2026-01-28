import { HomeTestPage } from '.';
import { expect, Locator } from '@playwright/test';

export class FindAddressPage {
  readonly homeTestPage: HomeTestPage;
  readonly postcodeInput: Locator;
  readonly numNameInput: Locator;
  readonly continueButton: Locator;
  readonly addressResults: Locator;
  readonly postcodeErrorMessage: Locator;
  readonly BuildingNoErrorMessage: Locator;
  readonly enterAddressManuallyLink: Locator;

  constructor(homeTestPage: HomeTestPage) {
    this.homeTestPage = homeTestPage;
    this.postcodeInput = homeTestPage.page.locator('#postcode');
    this.numNameInput = homeTestPage.page.locator('#building-number-or-name');
    this.continueButton = homeTestPage.page.getByRole('button', { name: 'Continue' });
    this.addressResults = homeTestPage.page.locator('.nhsuk-heading-l');
    this.postcodeErrorMessage = homeTestPage.page.locator('#postcode--error-message');
    this.BuildingNoErrorMessage = homeTestPage.page.locator('#building-number-or-name--error-message');
    this.enterAddressManuallyLink = homeTestPage.page.locator("a[href='enter-address-manually']");
  }

  async validatePostcode(postcode: string, firstLineAddress: string): Promise<void> {
    await this.postcodeInput.clear();
    await this.numNameInput.clear();
    await this.postcodeInput.fill(postcode);
    await this.numNameInput.fill(firstLineAddress);
    await this.continueButton.click();
  }

}
