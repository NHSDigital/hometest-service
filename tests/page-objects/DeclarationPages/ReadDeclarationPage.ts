import { type Locator, type Page } from '@playwright/test';
import { JourneyStepNames, pageTitlesMap } from '../../route-paths';
import { HTCPage } from '../HTCPage';

export enum CompleteNhsHealthCheckOptions {
  YES = 'Yes',
  NO = 'No'
}

export class ReadDeclarationPage extends HTCPage {
  readonly pageHeader: Locator;
  readonly yesRadioButton: Locator;
  readonly noRadioButton: Locator;
  readonly continueButton: Locator;
  readonly backLink: Locator;
  readonly selectionErrorLink: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.pageHeader = page
      .locator('h1')
      .getByText('What to expect during your NHS Health Check');
    this.yesRadioButton = page
      .locator('div')
      .filter({ hasText: /^Yes$/ })
      .getByRole('radio');
    this.noRadioButton = page
      .locator('div')
      .filter({
        hasText:
          /^No, I will contact my GP surgery to discuss my NHS Health Check$/
      })
      .getByRole('radio');
    this.continueButton = page.getByRole('button', { name: 'Continue' });
    this.backLink = page.getByRole('link', { name: 'Back' });
    this.selectionErrorLink = page.getByRole('link', {
      name: 'Select yes if you can complete your NHS Health Check online'
    });
    this.errorMessage = page.getByText(
      'Error: Select yes if you can complete your NHS Health Check online'
    );
  }

  async waitUntilLoaded(): Promise<void> {
    await this.pageHeader.waitFor();
  }

  async selectNhsHealthCheckOptions(
    selection: CompleteNhsHealthCheckOptions
  ): Promise<void> {
    if (selection === CompleteNhsHealthCheckOptions.YES) {
      await this.yesRadioButton.check();
    } else {
      await this.noRadioButton.check();
    }
  }

  async clickContinueButton(): Promise<void> {
    await this.continueButton.click();
  }

  async clickBackLink(): Promise<void> {
    await this.backLink.click();
  }

  async selectNhsHealthCheckOptionsAndClickContinue(
    selection: CompleteNhsHealthCheckOptions
  ): Promise<void> {
    await this.selectNhsHealthCheckOptions(selection);
    await this.clickContinueButton();
  }

  getExpectedTitleHeading(): string {
    return pageTitlesMap[JourneyStepNames.HealthCheckDeclarationPage];
  }
}
