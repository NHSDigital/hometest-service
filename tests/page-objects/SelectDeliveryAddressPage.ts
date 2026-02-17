import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class SelectDeliveryAddressPage extends BasePage {
  readonly editAddressLink: Locator;
  readonly address1: Locator;
  readonly continueButton: Locator;

  constructor(page: Page) {
    super(page);
    this.editAddressLink = page.getByRole('link', { name: 'Edit postcode' });
    this.address1 = page.locator('input[type="radio"][name="collection-point"]');
    this.continueButton = page.getByRole('button', { name: 'Continue' });
  }

  async clickEditAddressLink(): Promise<void> {
    await this.editAddressLink.click();
  }

  async clickContinueButton(): Promise<void> {
    await this.continueButton.click();
  }

  async selectAddressAndContinue(): Promise<void> {
    await this.address1.first().check();
    await this.continueButton.click();
  }
}
