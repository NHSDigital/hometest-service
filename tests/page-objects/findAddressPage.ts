import { WPHomePage } from '../page-objects';
import { expect, Locator } from '@playwright/test';

export class FindAddressPage {
  readonly wpHomePage: WPHomePage;
  readonly postcodeInput: Locator;
  readonly numNameInput: Locator;
  readonly continueButton: Locator;
  readonly addressResults: Locator;
  readonly errorMessage: Locator;
  readonly enterAddressManuallyLink: Locator;

  constructor(wpHomePage: WPHomePage) {
    this.wpHomePage = wpHomePage;
    this.postcodeInput = wpHomePage.page.locator('#postcode');
    this.numNameInput = wpHomePage.page.locator('#numName');
    this.continueButton = wpHomePage.page.getByRole('button', { name: 'Continue' });
    this.addressResults = wpHomePage.page.locator('.nhsuk-heading-l');
    this.errorMessage = wpHomePage.page.locator('.nhsuk-error-summary__title');
    this.enterAddressManuallyLink = wpHomePage.page.locator("a[href='./enter-address-manually']");
  }

  async navigateAndVerifyPage(): Promise<void> {
    await expect(this.postcodeInput).toBeEditable();
    await expect(this.numNameInput).toBeEditable();
    await expect(this.wpHomePage.page.getByText("Enter your delivery address")).toBeVisible();
    await expect(this.enterAddressManuallyLink).toBeVisible();
  }

  async validatePostcode(postcode: string, firstLineAddress: string): Promise<void> {
    await this.postcodeInput.fill(postcode);
    await this.numNameInput.fill(firstLineAddress);
    await this.continueButton.click();
    await expect(this.addressResults).toBeVisible();
    await expect(this.addressResults).toContainText('addresses found');

  }
}
