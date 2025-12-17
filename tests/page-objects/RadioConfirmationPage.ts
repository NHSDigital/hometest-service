import { type Locator, type Page } from '@playwright/test';
import { HTCPage } from './HTCPage';
import { type JourneyStepNames, pageTitlesMap } from '../route-paths';

export abstract class RadioConfirmationPage extends HTCPage {
  readonly pageHeader: Locator;
  readonly yesRadioButton: Locator;
  readonly noRadioButton: Locator;
  readonly continueButton: Locator;
  readonly backLink: Locator;
  readonly hasErrorLink: Locator;
  readonly errorMessage: Locator;
  readonly journeyStepName: JourneyStepNames;

  constructor(
    page: Page,
    headerText: string,
    errorText: string,
    journeyStepName: JourneyStepNames
  ) {
    super(page);

    this.pageHeader = page.locator(`h1:has-text("${headerText}")`);
    this.yesRadioButton = page.locator('input[type="radio"]').first();
    this.noRadioButton = page.locator('input[type="radio"]').last();
    this.continueButton = page.locator('button:has-text("Continue")');
    this.backLink = page.getByRole('link', { name: 'Back' });
    this.hasErrorLink = page.getByRole('link', {
      name: errorText
    });
    this.errorMessage = page.getByText('Error: ' + errorText);

    this.journeyStepName = journeyStepName;
  }

  async clickNoRadioButton(): Promise<void> {
    await this.noRadioButton.click();
  }

  async clickYesRadioButton(): Promise<void> {
    await this.yesRadioButton.click();
  }

  async clickContinueButton(): Promise<void> {
    await this.continueButton.click();
  }

  async waitUntilLoaded(): Promise<void> {
    await this.pageHeader.waitFor();
  }

  async clickBackLink(): Promise<void> {
    await this.backLink.click();
  }

  async getHeaderText(): Promise<string | null> {
    return await this.pageHeader.textContent();
  }

  getExpectedTitleHeading(): string {
    return pageTitlesMap[this.journeyStepName];
  }
}
