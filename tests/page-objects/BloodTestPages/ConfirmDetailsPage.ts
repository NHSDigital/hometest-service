import { type Locator, type Page } from '@playwright/test';
import { JourneyStepNames, pageTitlesMap } from '../../route-paths';
import { HTCPage } from '../HTCPage';

export class ConfirmDetailsPage extends HTCPage {
  readonly pageHeader: Locator;
  readonly addressSummary: Locator;
  readonly changeAddressLink: Locator;
  readonly backLink: Locator;
  readonly saveAndContinueButton: Locator;

  constructor(page: Page) {
    super(page);
    this.backLink = page.getByRole('link', { name: 'Back' });
    this.changeAddressLink = page.getByRole('link', {
      name: 'Delivery address'
    });
    this.pageHeader = page.locator('h1:has-text("Confirm your Details")');
    this.addressSummary = page.locator('xpath=//*[@id="maincontent"]/div/div');
    this.saveAndContinueButton = page.getByRole('button', {
      name: 'Confirm and order blood test'
    });
  }

  async waitUntilLoaded(): Promise<void> {
    await this.pageHeader.waitFor();
  }

  async getAddressSummaryText(): Promise<string | null> {
    return await this.addressSummary.textContent();
  }

  async clickSaveAndContinueButton(): Promise<void> {
    await this.saveAndContinueButton.click();
  }

  async clickChangeAddressLink(): Promise<void> {
    await this.changeAddressLink.click();
  }

  async clickBackLink(): Promise<void> {
    await this.backLink.click();
  }

  getExpectedTitleHeading(): string {
    return pageTitlesMap[JourneyStepNames.ConfirmDetailsPage];
  }
}
