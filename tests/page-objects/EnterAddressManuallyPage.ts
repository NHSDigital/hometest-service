import { Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage";
import { type Address } from "../models/Address";

export class EnterAddressManuallyPage extends BasePage {
  readonly addressLine1Input: Locator;
  readonly addressLine2Input: Locator;
  readonly addressLine3Input: Locator;
  readonly addressTownInput: Locator;
  readonly postCodeInput: Locator;
  readonly pageHeader: Locator;
  readonly continueButton: Locator;

  constructor(page: Page) {
    super(page);
    this.addressLine1Input = page.locator("#address-line-1");
    this.addressLine2Input = page.locator("#address-line-2");
    this.addressLine3Input = page.locator("#address-line-3");
    this.addressTownInput = page.locator("#address-town");
    this.postCodeInput = page.locator("#postcode");
    this.pageHeader = page.locator("h1", { hasText: "Enter your delivery address manually" });
    this.continueButton = page.getByRole("button", { name: "Continue" });
  }

  async clickContinue(): Promise<void> {
    await this.continueButton.click();
  }

  async fillAddressLine1Field(addressLine1: string): Promise<void> {
    await this.addressLine1Input.fill(addressLine1);
  }

  async waitUntilPageLoaded(): Promise<void> {
    await this.pageHeader.waitFor({ state: "visible" });
  }

  async fillAddressLine2Field(addressLine2: string): Promise<void> {
    await this.addressLine2Input.fill(addressLine2);
  }

  async fillAddressLine3Field(addressLine3: string): Promise<void> {
    await this.addressLine3Input.fill(addressLine3);
  }

  async fillTownCityField(townCity: string): Promise<void> {
    await this.addressTownInput.fill(townCity);
  }

  async fillPostCodeField(postCode: string): Promise<void> {
    await this.postCodeInput.fill(postCode);
  }

  async getAddressInputValues(): Promise<string> {
    const values = await Promise.all([
      this.addressLine1Input.inputValue(),
      this.addressLine2Input.inputValue(),
      this.addressLine3Input.inputValue(),
      this.addressTownInput.inputValue(),
      this.postCodeInput.inputValue(),
    ]);
    return values.filter(Boolean).join("");
  }

  async fillDeliveryAddressFields(deliveryAddress: Address): Promise<void> {
    await this.fillAddressLine1Field(deliveryAddress.addressLine1);
    if (deliveryAddress.addressLine2 !== undefined)
      await this.fillAddressLine2Field(deliveryAddress.addressLine2);
    await this.fillTownCityField(deliveryAddress.townCity);
    if (deliveryAddress.addressLine3 !== undefined)
      await this.fillAddressLine3Field(deliveryAddress.addressLine3);
    await this.fillPostCodeField(deliveryAddress.postCode);
  }
}
