import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

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
    this.enterAddressManuallyLink = page.getByText('Enter address manually')
  }

  async fillPostCodeAndAddressAndContinue(postcode: string, firstLineAddress: string): Promise<void> {
    await this.postcodeInput.fill(postcode);
    await this.numNameInput.fill(firstLineAddress);
    await this.continueButton.click();
  }

  async clickEnterAddressManuallyLink(): Promise<void> {
    await this.enterAddressManuallyLink.click();
  }

}
