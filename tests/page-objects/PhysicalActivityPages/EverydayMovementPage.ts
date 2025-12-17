import type { Locator, Page } from '@playwright/test';
import { HTCPage } from '../HTCPage';
import { JourneyStepNames, pageTitlesMap } from '../../route-paths';

export class EverydayMovementPage extends HTCPage {
  readonly pageHeader: Locator;
  readonly continueButton: Locator;
  readonly backLink: Locator;

  constructor(page: Page) {
    super(page);
    this.pageHeader = page.locator('h1:has-text("Everyday movement")');
    this.continueButton = page.getByRole('button', { name: 'Continue' });
    this.backLink = page.getByRole('link', { name: 'Back' });
  }

  async waitUntilLoaded(): Promise<void> {
    await this.pageHeader.waitFor();
  }

  async clickContinueButton(): Promise<void> {
    await this.continueButton.click();
  }

  async clickBackLink(): Promise<void> {
    await this.backLink.click();
  }

  getExpectedTitleHeading(): string {
    return pageTitlesMap[JourneyStepNames.EverydayMovementPage];
  }
}
