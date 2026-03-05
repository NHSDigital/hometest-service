import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class CheckYourAnswersPage extends BasePage {
  readonly consentCheckbox: Locator;
  readonly submitOrderButton: Locator;
  readonly actualMobileNumber: Locator;
  readonly actualAddress: Locator;
  readonly deliveryAddressChangeLink: Locator;
  readonly mobileNumberChangeLink: Locator;
  readonly comfortableChangeLink: Locator;

  constructor(page: Page) {
    super(page);
    this.consentCheckbox = page.locator('#consent-1');
    this.submitOrderButton = page.getByRole('button', { name: 'Submit order' });
    this.actualMobileNumber = page.locator('#mobile-number-value');
    this.actualAddress = page.locator('#delivery-address-value');
    this.comfortableChangeLink = page.locator('#comfortable-change');
    this.deliveryAddressChangeLink = page.locator('#address-change');
    this.mobileNumberChangeLink = page.locator('#mobile-change');
  }

  async getAddress(): Promise<string | null> {
    const actualAddressValue = await this.actualAddress.innerText()
    return actualAddressValue;
  }

  async getMobileNumber(): Promise<string> {
    return await this.actualMobileNumber.innerText();
  }

  async getComfortableDoingTest(): Promise<string> {
    return await this.comfortableChangeLink.innerText();
  }

  async selectConsentCheckbox(): Promise<void> {
    await this.consentCheckbox.check();
  }

  async clickSubmitOrder(): Promise<void> {
    await this.submitOrderButton.click();
  }

  async clickDeliveryAddressChangeLink(): Promise<void> {
    await this.deliveryAddressChangeLink.click();
  }

  async clickMobileNumberChangeLink(): Promise<void> {
    await this.mobileNumberChangeLink.click();
  }

  async isConsentCheckboxChecked(): Promise<boolean> {
    const isChecked = await this.consentCheckbox.isChecked();
    return isChecked
  }

  async clickComfortableChangeLink(): Promise<void> {
    await this.comfortableChangeLink.click();
  }


}
