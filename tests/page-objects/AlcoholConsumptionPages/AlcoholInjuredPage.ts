import { type Locator, type Page } from '@playwright/test';
import { JourneyStepNames, pageTitlesMap } from '../../route-paths';
import { HTCPage } from '../HTCPage';

export class AlcoholInjuredPage extends HTCPage {
  readonly backLink: Locator;
  readonly pageHeader: Locator;
  readonly continueButton: Locator;
  readonly noRadioButton: Locator;
  readonly yesButNotPastYearRadioButton: Locator;
  readonly yesDuringPastYearRadioButton: Locator;
  readonly injuredErrorLink: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.noRadioButton = page.getByLabel('No', { exact: true });
    this.yesButNotPastYearRadioButton = page.getByLabel(
      'Yes, but not in the past year'
    );
    this.yesDuringPastYearRadioButton = page.getByLabel(
      'Yes, during the past year'
    );
    this.continueButton = page.getByText('Continue');
    this.backLink = page.getByText('Back');
    this.pageHeader = page.locator(
      'h1:has-text("Have you or somebody else been injured")'
    );
    this.injuredErrorLink = page.getByRole('link', {
      name: 'Select yes if you or somebody else has been injured as a result of your drinking'
    });
    this.errorMessage = page.getByText(
      'Error: Select yes if you or somebody else has been injured as a result of your drinking'
    );
  }

  async selectInjuredPastYear(injuredPastYear: boolean): Promise<void> {
    if (injuredPastYear) {
      await this.checkYesDuringPastYearButton();
    } else {
      await this.checkNoButton();
    }
  }

  async checkNoButton(): Promise<void> {
    await this.noRadioButton.check();
  }

  async checkYesButNotPastYearButton(): Promise<void> {
    await this.yesButNotPastYearRadioButton.check();
  }

  async checkYesDuringPastYearButton(): Promise<void> {
    await this.yesDuringPastYearRadioButton.check();
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
    return pageTitlesMap[JourneyStepNames.AlcoholPersonInjuredPage];
  }
}
