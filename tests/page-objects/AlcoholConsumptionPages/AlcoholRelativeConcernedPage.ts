import { type Locator, type Page } from '@playwright/test';
import { JourneyStepNames, pageTitlesMap } from '../../route-paths';
import { HTCPage } from '../HTCPage';
import { AlcoholPersonInjuredAndConcernedRelative } from '../../lib/enum/health-check-answers';

export class AlcoholRelativeConcernedPage extends HTCPage {
  readonly backLink: Locator;
  readonly pageHeader: Locator;
  readonly continueButton: Locator;
  readonly noRadioButton: Locator;
  readonly yesButNotPastYearRadioButton: Locator;
  readonly yesDuringPastYearRadioButton: Locator;
  readonly cutDownDrinkingErrorLink: Locator;
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
      'h1:has-text("Has a relative, friend, doctor or other health worker been concerned")'
    );
    this.cutDownDrinkingErrorLink = page.getByRole('link', {
      name: 'Select yes if a relative, friend, doctor or other health worker has been concerned about your drinking, or suggested that you cut down'
    });
    this.errorMessage = page.getByText(
      'Error: Select yes if a relative, friend'
    );
  }

  async checkNoButton(): Promise<void> {
    await this.noRadioButton.check();
  }

  async selectOption(
    option: AlcoholPersonInjuredAndConcernedRelative
  ): Promise<void> {
    switch (option) {
      case AlcoholPersonInjuredAndConcernedRelative.No:
        await this.checkNoButton();
        break;
      case AlcoholPersonInjuredAndConcernedRelative.YesNotPastYear:
        await this.checkYesButNotPastYearButton();
        break;
      case AlcoholPersonInjuredAndConcernedRelative.YesDuringPastYear:
        await this.checkYesDuringPastYearButton();
        break;
      default:
        throw new Error('Unknown option');
    }
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
    return pageTitlesMap[JourneyStepNames.AlcoholConcernedRelativePage];
  }
}
