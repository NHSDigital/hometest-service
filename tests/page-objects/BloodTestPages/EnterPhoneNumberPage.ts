import { type Locator, type Page } from '@playwright/test';
import { HTCPage } from '../HTCPage';
import { JourneyStepNames, pageTitlesMap } from '../../route-paths';

export class EnterPhoneNumberPage extends HTCPage {
  readonly page: Page;
  readonly phoneNumberInput: Locator;
  readonly continueButton: Locator;
  readonly backLink: Locator;
  readonly pageHeader: Locator;
  readonly phoneNumberErrorLink: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;
    this.phoneNumberInput = page.locator('#phone-number');
    this.continueButton = page.locator('button:has-text("Continue")');
    this.backLink = page.getByRole('link', { name: 'Back' });
    this.pageHeader = page.locator(
      'h1:has-text("Get text updates about your blood test")'
    );
    this.phoneNumberErrorLink = page.getByRole('link', {
      name: 'There is a problem'
    });

    this.errorMessage = page.locator(
      'span:has-text("Error: Enter a UK mobile phone number in the correct format")'
    );
  }

  async clickContinueButton(): Promise<void> {
    await this.continueButton.click();
  }

  async clickBackLink(): Promise<void> {
    await this.backLink.click();
  }

  async getHeaderText(): Promise<string | null> {
    return await this.pageHeader.textContent();
  }

  async waitUntilLoaded(): Promise<void> {
    await this.pageHeader.waitFor();
  }

  async fillPhoneNumberField(phoneNumber: string): Promise<void> {
    await this.phoneNumberInput.fill(phoneNumber);
  }

  async getPhoneNumberErrorMessageText(): Promise<string | null> {
    return await this.errorMessage.textContent();
  }

  getExpectedTitleHeading(): string {
    return pageTitlesMap[JourneyStepNames.EnterPhoneNumberPage];
  }
}
