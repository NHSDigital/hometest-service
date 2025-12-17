import { type Locator, type Page } from '@playwright/test';
import { HTCPage } from '../HTCPage';
import { JourneyStepNames, pageTitlesMap } from '../../route-paths';

export class TownsendPostcodePage extends HTCPage {
  readonly page: Page;
  readonly postcodeInput: Locator;
  readonly continueButton: Locator;
  readonly backLink: Locator;
  readonly pageHeader: Locator;
  readonly postcodeErrorLink: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;
    this.postcodeInput = page.locator('#postcode');
    this.continueButton = page.locator('button:has-text("Continue")');
    this.backLink = page.getByRole('link', { name: 'Back' });
    this.pageHeader = page.locator('h1:has-text("Enter your postcode")');
    this.postcodeErrorLink = page.getByRole('link', {
      name: 'Enter a full UK postcode'
    });
    this.errorMessage = page.getByText('Error: Enter a full UK postcode');
  }

  async fillPostcodeField(postcode: string): Promise<void> {
    await this.postcodeInput.fill(postcode);
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

  getExpectedTitleHeading(): string {
    return pageTitlesMap[JourneyStepNames.TownsendPostcodePage];
  }
}
