import { Locator, Page } from "@playwright/test";

import { BasePage } from "./BasePage";

export class SelectDeliveryAddressPage extends BasePage {
  readonly editPostcodeLink: Locator;
  readonly continueButton: Locator;
  readonly enterAddressManuallyLink: Locator;
  readonly pageHeader: Locator;

  constructor(page: Page) {
    super(page);
    this.editPostcodeLink = page.getByRole("link", { name: "Edit postcode" });
    this.pageHeader = page.locator("h1", { hasText: "found" });
    this.continueButton = page.getByRole("button", { name: "Continue" });

    this.enterAddressManuallyLink = page.getByRole("link", { name: "Enter address manually" });
  }

  async waitUntilPageLoaded(): Promise<void> {
    await this.pageHeader.waitFor({ state: "visible" });
    await this.page.locator(".nhsuk-radios__item").first().waitFor({ state: "visible" });
  }

  async clickContinueButton(): Promise<void> {
    await this.continueButton.click();
  }

  async clickEditPostcodeLink(): Promise<void> {
    await this.editPostcodeLink.click();
  }

  async clickEnterAddressManuallyLink(): Promise<void> {
    await this.enterAddressManuallyLink.click();
  }

  async getNumberOfFilteredAddresses(): Promise<number> {
    const listOfAddresses = this.page.locator("#collection-point .nhsuk-radios__item");
    return await listOfAddresses.count();
  }

  async selectAddressAndContinue(option?: string): Promise<string[]> {
    const count = await this.getNumberOfFilteredAddresses();
    const selectedOption = option ?? String(Math.floor(Math.random() * count) + 1);
    const addressRadioButton = this.page.locator(`#collection-point-${selectedOption}`);
    await addressRadioButton.click();
    const addressLabel = this.page.locator(`#collection-point-${selectedOption}--label`);
    const addressText = await addressLabel.innerText();
    const addressArray = addressText.split(",").map((line) => line.trim());
    await this.continueButton.click();
    return addressArray;
  }
}
