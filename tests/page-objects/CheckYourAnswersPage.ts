import { Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export class CheckYourAnswersPage extends BasePage {
  readonly consentCheckbox: Locator;
  readonly pageHeader: Locator;
  readonly submitOrderButton: Locator;
  readonly currentMobileNumber: Locator;
  readonly currentAddress: Locator;
  readonly currentComfortableDoingTest: Locator;
  readonly deliveryAddressChangeLink: Locator;
  readonly mobileNumberChangeLink: Locator;
  readonly comfortableChangeLink: Locator;

  constructor(page: Page) {
    super(page);
    this.consentCheckbox = page.locator("#consent-1");
    this.pageHeader = page.locator("h1", { hasText: "Check your answers before submitting your order" });
    this.submitOrderButton = page.getByRole("button", { name: "Submit order" });
    this.currentMobileNumber = page.locator("#mobile-number-value");
    this.currentAddress = page.locator("#delivery-address-value");
    this.currentComfortableDoingTest = page.locator("#comfortable-doing-test-value");
    this.comfortableChangeLink = page.locator("#comfortable-change");
    this.deliveryAddressChangeLink = page.locator("#address-change");
    this.mobileNumberChangeLink = page.locator("#mobile-change");
  }

  async clickSubmitOrder(): Promise<void> {
    await this.submitOrderButton.click();
  }

  async getAddressValue(): Promise<string[] | null> {
    const currentAddressValue = await this.currentAddress.allInnerTexts();
    return currentAddressValue[0].split("\n");
  }

  async getMobileNumberValue(): Promise<string | null> {
    const currentMobileNumberValue = await this.currentMobileNumber.textContent();
    return currentMobileNumberValue;
  }

  async getComfortableDoingTestValue(): Promise<string | null> {
    const currentComfortableDoingTestValue = await this.currentComfortableDoingTest.textContent();
    return currentComfortableDoingTestValue;
  }

  async checkConsentCheckbox(): Promise<void> {
    await this.consentCheckbox.check();
  }

  async clickDeliveryAddressChangeLink(): Promise<void> {
    await this.deliveryAddressChangeLink.click();
  }

  async clickMobileNumberChangeLink(): Promise<void> {
    await this.mobileNumberChangeLink.click();
  }

  async clickComfortableChangeLink(): Promise<void> {
    await this.comfortableChangeLink.click();
  }

  async isConsentCheckboxChecked(): Promise<boolean> {
    return await this.consentCheckbox.isChecked();
  }

  async waitUntilPageLoaded(): Promise<void> {
    await this.pageHeader.waitFor({ state: "visible" });
  }
}
