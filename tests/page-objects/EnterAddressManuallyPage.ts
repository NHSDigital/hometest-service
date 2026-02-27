import { Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage";
import { type Address } from "../models/Address";

export class EnterAddressManuallyPage extends BasePage {
  readonly addressLine1Input: Locator;
  readonly addressLine2Input: Locator;
  readonly addressLine3Input: Locator;
  readonly addressTownInput: Locator;
  readonly postCodeInput: Locator;
  readonly continueButton: Locator;

  constructor(page: Page) {
    super(page);
    this.addressLine1Input = page.locator("#address-line-1");
    this.addressLine2Input = page.locator("#address-line-2");
    this.addressLine3Input = page.locator("#address-line-3");
    this.addressTownInput = page.locator("#address-town");
    this.postCodeInput = page.locator("#postcode");
    this.continueButton = page.getByRole("button", { name: "Continue" });
  }

  async fillAddressAndContinue(address: Address): Promise<void> {
    await this.addressLine1Input.fill(address.addressLine1);
    await this.addressLine2Input.fill(address.addressLine2 ?? "");
    await this.addressLine3Input.fill(address.addressLine3 ?? "");
    await this.addressTownInput.fill(address.townCity);
    await this.postCodeInput.fill(address.postCode);
    await this.continueButton.click();
  }
}
