import { type Locator, type Page } from '@playwright/test';
import { JourneyStepNames, pageTitlesMap } from '../../route-paths';
import { HTCPage } from '../HTCPage';

export class SelectDeliveryAddressPage extends HTCPage {
  readonly continueButton: Locator;
  readonly pageHeader: Locator;
  readonly searchAgainLink: Locator;
  readonly backLink: Locator;

  constructor(page: Page) {
    super(page);
    this.continueButton = page.getByRole('button', {
      name: 'Use this address'
    });
    this.pageHeader = page.locator('h1:has-text("addresses found")');
    this.searchAgainLink = page.getByRole('link', {
      name: 'Search again'
    });
    this.backLink = page.getByRole('link', { name: 'Back' });
  }

  async waitUntilLoaded(): Promise<void> {
    await this.pageHeader.waitFor();
  }

  async clickContinueButton(): Promise<void> {
    await this.continueButton.click();
  }

  async clickSearchAgainLink(): Promise<void> {
    await this.searchAgainLink.click();
  }

  async selectAddress(option: string = '1'): Promise<void> {
    const addressRadioButton = this.page.locator(`#address-${option}`);
    await addressRadioButton.check();
  }

  async getNumberOfFilteredAddresses(): Promise<number> {
    const listOfAddresses = this.page.locator('xpath=//*[@id="address"]/div');
    return await listOfAddresses.count();
  }

  async clickBackLink(): Promise<void> {
    await this.backLink.click();
  }

  getExpectedTitleHeading(): string {
    return pageTitlesMap[JourneyStepNames.SelectAddressPage];
  }
}
