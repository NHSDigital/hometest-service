import { type Locator, type Page } from '@playwright/test';
import { JourneyStepNames, pageTitlesMap } from '../../route-paths';
import { HTCPage } from '../HTCPage';

export class FindDeliveryAddressPage extends HTCPage {
  readonly continueButton: Locator;
  readonly enterAddressManuallyLink: Locator;
  readonly pageHeader: Locator;
  readonly buildingNumberInput: Locator;
  readonly postcodeInput: Locator;
  readonly postcodeErrorLink: Locator;
  readonly postcodeErrorMessageText: Locator;
  readonly buildingNumberErrorMessageText: Locator;
  readonly backLink: Locator;

  constructor(page: Page) {
    super(page);
    this.continueButton = page.getByRole('button', { name: 'Continue' });
    this.pageHeader = page.locator('h1:has-text("Find your delivery address")');
    this.buildingNumberInput = page.locator('#address-building-number');
    this.postcodeInput = page.locator('#address-postal-code');
    this.enterAddressManuallyLink = page.getByRole('link', {
      name: 'Enter address manually'
    });
    this.backLink = page.getByRole('link', {
      name: 'Back'
    });
    this.postcodeErrorLink = page.getByRole('link', {
      name: 'Enter postcode'
    });
    this.postcodeErrorMessageText = page.locator(
      '#address-postal-code--error-message'
    );
    this.buildingNumberErrorMessageText = page.locator(
      '#address-building-number--error-message'
    );
  }

  async waitUntilLoaded(): Promise<void> {
    await this.pageHeader.waitFor();
  }

  async clickContinueButton(): Promise<void> {
    await this.continueButton.click();
  }

  async clickEnterAddressManuallyLink(): Promise<void> {
    await this.enterAddressManuallyLink.click();
  }

  async fillBuildingNumberField(buildingNumber: string): Promise<void> {
    await this.buildingNumberInput.fill(buildingNumber);
  }

  async fillPostcodeField(postcode: string): Promise<void> {
    await this.postcodeInput.fill(postcode);
  }

  async getPostcodeErrorMessageText(): Promise<string | null> {
    return await this.postcodeErrorMessageText.textContent();
  }

  async getBuildingNumberErrorMessageText(): Promise<string | null> {
    return await this.buildingNumberErrorMessageText.textContent();
  }

  async clickBackLink(): Promise<void> {
    await this.backLink.click();
  }

  async fillPostcodeFieldAndClickContinue(postcode: string): Promise<void> {
    await this.fillPostcodeField(postcode);
    await this.clickContinueButton();
  }

  async fillPostcodeAndBuildingNumberAndClickContinue(
    postcode: string,
    buildingNumber: string
  ): Promise<void> {
    await this.fillBuildingNumberField(buildingNumber);
    await this.fillPostcodeFieldAndClickContinue(postcode);
  }

  getExpectedTitleHeading(): string {
    return pageTitlesMap[JourneyStepNames.FindAddressPage];
  }
}
