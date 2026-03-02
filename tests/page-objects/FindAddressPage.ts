import { Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage";
import { Address } from "../models/Address";

export class FindAddressPage extends BasePage {
  readonly postCodeInput: Locator;
  readonly numNameInput: Locator;
  readonly continueButton: Locator;
  readonly addressResults: Locator;
  readonly postCodeErrorMessage: Locator;
  readonly buildingNoErrorMessage: Locator;
  readonly enterAddressManuallyLink: Locator;

  constructor(page: Page) {
    super(page);
    this.postCodeInput = page.locator("#postcode");
    this.numNameInput = page.locator("#building-number-or-name");
    this.continueButton = page.getByRole("button", { name: "Continue" });
    this.addressResults = page.locator(".nhsuk-heading-l");
    this.postCodeErrorMessage = page.locator("#postcode--error-message");
    this.buildingNoErrorMessage = page.locator(
      "#building-number-or-name--error-message",
    );
    this.enterAddressManuallyLink = page.getByText("Enter address manually");
  }

  async fillPostCodeAndAddressAndContinue(
    deliveryAddress: Address,
  ): Promise<void> {
    await this.postCodeInput.fill(deliveryAddress.postCode);
    await this.numNameInput.fill(deliveryAddress.addressLine1);
    await this.continueButton.click();
  }

  async clickEnterAddressManuallyLink(): Promise<void> {
    await this.enterAddressManuallyLink.click();
  }

  async getPostcodeAndAddressValues(): Promise<{
    postCode: string;
    firstLineAddress: string;
  }> {
    const postCodeValue = await this.postCodeInput.inputValue();
    const firstLineAddressValue = await this.numNameInput.inputValue();
    return { postCode: postCodeValue, firstLineAddress: firstLineAddressValue };
  }

  async fillPostCodeAndContinue(deliveryAddress: Address): Promise<void> {
    await this.postCodeInput.fill(deliveryAddress.postCode);
    await this.continueButton.click();
  }
}
