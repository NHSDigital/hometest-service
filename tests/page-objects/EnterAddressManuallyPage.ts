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
  private addressLine1: string | null = null;
  private addressLine2: string | null = null;
  private addressLine3: string | null = null;
  private townCity: string | null = null;
  private postcode: string | null = null;

  constructor(page: Page) {
    super(page);
    this.addressLine1Input = page.locator("#address-line-1");
    this.addressLine2Input = page.locator("#address-line-2");
    this.addressLine3Input = page.locator("#address-line-3");
    this.addressTownInput = page.locator("#address-town");
    this.postCodeInput = page.locator("#postcode");
    this.continueButton = page.getByRole("button", { name: "Continue" });
  }

  async fillAddress(deliveryAddress: Address): Promise<void> {
    this.addressLine1 = deliveryAddress.addressLine1 ?? "";
    this.addressLine2 = deliveryAddress.addressLine2 ?? "";
    this.addressLine3 = (deliveryAddress.addressLine3 ?? "") + "UPDATED";
    this.townCity = deliveryAddress.townCity;
    this.postcode = deliveryAddress.postCode;
    await this.addressLine1Input.fill(this.addressLine1);
    await this.addressLine2Input.fill(this.addressLine2);
    await this.addressLine3Input.fill(this.addressLine3);
    await this.addressTownInput.fill(this.townCity);
    await this.postCodeInput.fill(this.postcode);
  }

  async clickContinue(): Promise<void> {
    await this.continueButton.click();
  }

  async getAddressInputValues(): Promise<string> {
    const addressValues = [
      this.addressLine1 ?? "",
      this.addressLine2 ?? "",
      this.addressLine3 ?? "",
      this.townCity ?? "",
      this.postcode ?? ""
    ]
      .filter(x => x.trim().length > 0)
      .join("\n");

    return addressValues;
  }
}

