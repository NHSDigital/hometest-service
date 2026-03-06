import { Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage";
import { PersonalDetailsModel } from "../models/PersonalDetails";

export class ConfirmMobileNumberPage extends BasePage {
  readonly mobileNumberInput: Locator;
  readonly useAnotherMobileNumber: Locator;
  readonly confirmMobileNumber: Locator;
  readonly continueButton: Locator;
  readonly confirmationMobileNumberLabel: Locator;

  constructor(page: Page) {
    super(page);
    this.confirmMobileNumber = page.locator("#phone-confirmation-1");
    this.useAnotherMobileNumber = page.locator("#phone-confirmation-2");
    this.mobileNumberInput = page.locator("#alternative-mobile-number");
    this.continueButton = page.getByRole("button", { name: "Continue" });
    this.confirmationMobileNumberLabel = page.locator("#phone-confirmation-1--label");
  }

  async clickContinue(): Promise<void> {
    await this.continueButton.click();
  }

  async selectUseAnotherMobileNumberOption(): Promise<void> {
    await this.useAnotherMobileNumber.click();
  }

  async fillAlternativeMobileNumberAndContinue(
    personalDetails: PersonalDetailsModel,
  ): Promise<void> {
    await this.useAnotherMobileNumber.click();
    await this.mobileNumberInput.fill(personalDetails.mobileNumber);
    await this.clickContinue();
  }

  async selectConfirmMobileNumberAndContinue(): Promise<void> {
    await this.confirmMobileNumber.click();
    await this.clickContinue();
  }

  async getConfirmationMobileNumberLabelText(): Promise<string> {
    const currentNumber = await this.confirmationMobileNumberLabel.textContent();
    return currentNumber ? currentNumber.trim() : "";
  }
}
