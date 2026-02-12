import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class HowComfortablePrickingFingerPage extends BasePage {
  readonly yesOption: Locator;
  readonly noOption: Locator;
  readonly continueButton: Locator;

  constructor(page: Page) {
    super(page);
    this.yesOption = page.locator('#comfortable-1');
    this.noOption = page.locator('#comfortable-2');
    this.continueButton = page.getByRole('button', { name: 'Continue' });
  }

  async selectYesOptionAndContinue(): Promise<void> {
    await this.yesOption.check();
    await this.continueButton.click();
  }

  async selectNoOptionAndContinue(): Promise<void> {
    await this.noOption.check();
    await this.continueButton.click();
  }


}
