import { Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage";
import { Address } from "../models/Address";

export class EnterDeliveryAddressPage extends BasePage {
  readonly postCodeInput: Locator;
  readonly buildingDetailsInput: Locator;
  readonly continueButton: Locator;
  readonly enterAddressManuallyLink: Locator;
  readonly pageHeader: Locator;

  constructor(page: Page) {
    super(page);
    this.postCodeInput = page.locator("#postcode");
    this.buildingDetailsInput = page.locator("#building-number-or-name");
    this.continueButton = page.getByRole("button", { name: "Continue" });
    this.enterAddressManuallyLink = page.getByText("Enter address manually");
    this.pageHeader = page.locator("h1", { hasText: "Enter your delivery address" });
  }

  async waitUntilPageLoaded(): Promise<void> {
    await this.pageHeader.waitFor({ state: "visible" });
  }

  async clickContinueButton(): Promise<void> {
    await this.continueButton.click();
  }

  async fillPostCodeAndContinue(deliveryAddress: Address): Promise<void> {
    await this.postCodeInput.fill(deliveryAddress.postCode);
    await this.clickContinueButton();
  }

  async fillPostCodeAndAddressAndContinue(deliveryAddress: Address): Promise<void> {
    await this.postCodeInput.fill(deliveryAddress.postCode);
    await this.buildingDetailsInput.fill(deliveryAddress.addressLine1);
    await this.clickContinueButton();
  }

  async clickEnterAddressManuallyLink(): Promise<void> {
    await this.enterAddressManuallyLink.click();
  }
}
