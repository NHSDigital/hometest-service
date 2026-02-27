import { Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage";
import { PersonalDetailsModel } from "../models/PersonalDetails";

export class ConfirmAndUpdateMobileNumberPage extends BasePage {
  readonly mobileNumberInput: Locator;
  readonly useAnotherMobileNumber: Locator;
  readonly confirmMobileNumber: Locator;
  readonly continueButton: Locator;

  constructor(page: Page) {
    super(page);
    this.confirmMobileNumber = page.locator("#phone-confirmation-1");
    this.useAnotherMobileNumber = page.locator("#phone-confirmation-2");
    this.mobileNumberInput = page.locator("#alternative-mobile-number");
    this.continueButton = page.getByRole("button", { name: "Continue" });
  }

  async fillAlternativeMobileNumber(
    personalDetails: PersonalDetailsModel,
  ): Promise<void> {
    await this.useAnotherMobileNumber.click();
    await this.mobileNumberInput.fill(personalDetails.mobileNumber);
  }

  async selectConfirmMobileNumber(): Promise<void> {
    await this.confirmMobileNumber.click();
  }

  async clickContinue(): Promise<void> {
    await this.continueButton.click();
  }
}
