import { type Locator, type Page } from '@playwright/test';
import { type DeliverAddress } from '../../lib/apiClients/HealthCheckModel';
import { JourneyStepNames, pageTitlesMap } from '../../route-paths';
import { HTCPage } from '../HTCPage';

export class EnterDeliveryAddressPage extends HTCPage {
  readonly continueButton: Locator;
  readonly pageHeader: Locator;
  readonly addressLine1Input: Locator;
  readonly addressLine2Input: Locator;
  readonly addressLine3Input: Locator;
  readonly townCityInput: Locator;
  readonly postcodeInput: Locator;
  readonly addressLine1ErrorLink: Locator;
  readonly townCityErrorLink: Locator;
  readonly postcodeErrorLink: Locator;
  readonly addressLine1ErrorMessageText: Locator;
  readonly addressLine2ErrorMessageText: Locator;
  readonly addressLine3ErrorMessageText: Locator;
  readonly townCityErrorMessageText: Locator;
  readonly postcodeErrorMessageText: Locator;
  readonly backLink: Locator;

  constructor(page: Page) {
    super(page);
    this.continueButton = page.getByRole('button', { name: 'Continue' });
    this.pageHeader = page.locator(
      'h1:has-text("Enter your delivery address")'
    );
    this.backLink = page.getByRole('link', {
      name: 'Back'
    });
    this.addressLine1Input = page.locator('#address-line1');
    this.addressLine2Input = page.locator('#address-line2');
    this.addressLine3Input = page.locator('#address-line3');
    this.townCityInput = page.locator('#town-city');
    this.postcodeInput = page.locator('#address-postal-code');
    this.addressLine1ErrorLink = page.getByRole('link', {
      name: 'Enter address line 1, typically the building and street'
    });
    this.townCityErrorLink = page.getByRole('link', {
      name: 'Enter town or city'
    });
    this.postcodeErrorLink = page.getByRole('link', {
      name: 'Enter postcode'
    });
    this.addressLine1ErrorMessageText = page.locator(
      '#address-line1--error-message'
    );
    this.addressLine2ErrorMessageText = page.locator(
      '#address-line2--error-message'
    );
    this.addressLine3ErrorMessageText = page.locator(
      '#address-line3--error-message'
    );
    this.townCityErrorMessageText = page.locator('#town-city--error-message');
    this.postcodeErrorMessageText = page.locator(
      '#address-postal-code--error-message'
    );
  }

  async waitUntilLoaded(): Promise<void> {
    await this.pageHeader.waitFor();
  }

  async clickContinueButton(): Promise<void> {
    await this.continueButton.click();
  }

  async fillAddressLine1Field(addressLine1: string): Promise<void> {
    await this.addressLine1Input.fill(addressLine1);
  }

  async fillAddressLine2Field(addressLine2: string): Promise<void> {
    await this.addressLine2Input.fill(addressLine2);
  }

  async fillTownCityField(townCity: string): Promise<void> {
    await this.townCityInput.fill(townCity);
  }

  async fillAddressLine3Field(addressLine3: string): Promise<void> {
    await this.addressLine3Input.fill(addressLine3);
  }

  async fillPostcodeField(postcode: string): Promise<void> {
    await this.postcodeInput.fill(postcode);
  }

  async fillDeliveryAddressFields(
    deliveryAddress: DeliverAddress
  ): Promise<void> {
    await this.fillAddressLine1Field(deliveryAddress.addressLine1);
    if (deliveryAddress.addressLine2 !== undefined)
      await this.fillAddressLine2Field(deliveryAddress.addressLine2);
    await this.fillTownCityField(deliveryAddress.townCity);
    if (deliveryAddress.addressLine3 !== undefined)
      await this.fillAddressLine3Field(deliveryAddress.addressLine3);
    await this.fillPostcodeField(deliveryAddress.postcode);
  }

  async fillDeliveryAddressAndClickContinue(
    deliveryAddress: DeliverAddress
  ): Promise<void> {
    await this.fillDeliveryAddressFields(deliveryAddress);
    await this.clickContinueButton();
  }

  async getAddressLine1ErrorMessageText(): Promise<string | null> {
    return await this.addressLine1ErrorMessageText.textContent();
  }

  async getAddressLine2ErrorMessageText(): Promise<string | null> {
    return await this.addressLine2ErrorMessageText.textContent();
  }

  async getAddressLine3ErrorMessageText(): Promise<string | null> {
    return await this.addressLine3ErrorMessageText.textContent();
  }

  async getTownCityErrorMessageText(): Promise<string | null> {
    return await this.townCityErrorMessageText.textContent();
  }

  async getPostcodeErrorMessageText(): Promise<string | null> {
    return await this.postcodeErrorMessageText.textContent();
  }

  async clickBackLink(): Promise<void> {
    await this.backLink.click();
  }

  getExpectedTitleHeading(): string {
    return pageTitlesMap[JourneyStepNames.EnterAddressPage];
  }
}
