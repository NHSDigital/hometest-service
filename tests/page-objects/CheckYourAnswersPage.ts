import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class CheckYourAnswersPage extends BasePage {
    readonly mobileNumberInput: Locator;
    readonly consentCheckbox: Locator;
    readonly submitOrderButton: Locator;
    readonly actualMobileNumber: Locator;
    readonly actualAddress: Locator;

    constructor(page: Page) {
        super(page);
        this.mobileNumberInput = page.locator('#phone-confirmation-1--label');
        this.consentCheckbox = page.locator('#consent-1');
        this.submitOrderButton = page.getByRole('button', { name: 'Submit order' });
        this.actualMobileNumber = page.locator('#mobile-number-value');
        this.actualAddress = page.locator('#delivery-address-value');
    }

    async getMobileNumber(): Promise<string> {
        return await this.mobileNumberInput.innerText();
    }

    async getPostcodeAndMobileNumber(): Promise<{actualPostcode: string | null, actualMobileNumber: string}> {
        const actualAddressValue = await this.actualAddress.innerText()
        const actualMobileNumberValue = await this.actualMobileNumber.innerText();
        const actualPostcodeValue = extractUKPostcode(actualAddressValue);
        return { actualPostcode: actualPostcodeValue, actualMobileNumber: actualMobileNumberValue };
    }

    async selectConsentCheckbox(): Promise<void> {
        await this.consentCheckbox.check();
    }

    async clickSubmitOrder(): Promise<void> {
        await this.submitOrderButton.click();
    }

    async clickDeliveryAddressChangeLink(): Promise<void> {
        // await this.actualAddress.click();
    }

    async clickMobileNumberChangeLink(): Promise<void> {
        // await this.mobileNumberInput.click();
    }

    async isConsentCheckboxChecked(): Promise<boolean> {
        const isChecked = await this.consentCheckbox.isChecked();
        return isChecked
    }


}

/**
 * Extract the first UK postcode from a free-form address string.
 * - Normalizes to "OUTCODE INCODE" (single space, uppercase)
 * Returns null if none is found.
 */
export function extractUKPostcode(address: string): string | null {
  if (!address) return null;

  // Robust UK postcode regex (covers standard formats + 'GIR 0AA')
  const ukPostcodeRegex =
    /\b(GIR\s?0AA|(?:(?:[A-PR-UWYZ][0-9][0-9]?)|(?:[A-PR-UWYZ][A-HK-Y][0-9][0-9]?)|(?:[A-PR-UWYZ][0-9][A-HJKPSTUW])|(?:[A-PR-UWYZ][A-HK-Y][0-9][ABEHMNPRVWXY]))\s?[0-9][ABD-HJLNP-UW-Z]{2})\b/i;

  const match = address.match(ukPostcodeRegex);
  if (!match) return null;

  // Normalize spacing and casing: e.g., "cm74by" -> "CM7 4BY"
  const raw = match[0].toUpperCase().replace(/\s+/g, "");
  return raw.slice(0, raw.length - 3) + " " + raw.slice(-3);
}
