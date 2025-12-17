import { type Locator, type Page } from '@playwright/test';
import { JourneyStepNames, pageTitlesMap } from '../../route-paths';
import { HTCPage } from '../HTCPage';

export class OrderBloodTestKitPage extends HTCPage {
  readonly continueButton: Locator;
  readonly pageHeader: Locator;
  readonly cantTakeBloodTestLink: Locator;
  readonly backLink: Locator;
  readonly successBanner: Locator;

  constructor(page: Page) {
    super(page);
    this.continueButton = page.getByRole('button', {
      name: 'Order a blood test kit'
    });
    this.pageHeader = page.locator('h1:has-text("Order a blood test kit")');
    this.cantTakeBloodTestLink = page.getByRole('link', {
      name: 'I do not want to do a blood test at home'
    });
    this.backLink = page.getByRole('link', { name: 'Back' });
    this.successBanner = page.getByText('Success');
  }

  async clickContinueButton(): Promise<void> {
    await this.continueButton.click();
  }

  async clickCantTakeBloodTestLink(): Promise<void> {
    await this.cantTakeBloodTestLink.click();
  }

  async waitUntilLoaded(): Promise<void> {
    await this.pageHeader.waitFor();
  }

  async clickBackLink(): Promise<void> {
    await this.backLink.click();
  }

  async isSuccessBannerVisible(): Promise<boolean> {
    return this.successBanner.isVisible();
  }

  getExpectedTitleHeading(): string {
    return pageTitlesMap[JourneyStepNames.BloodTestDeclarationPage];
  }
}
