import { type Locator, type Page } from '@playwright/test';
import { JourneyStepNames, pageTitlesMap } from '../../route-paths';
import { HTCPage } from '../HTCPage';
import { AlcoholHowOften } from '../../lib/enum/health-check-answers';

export class HowOftenAlcoholPage extends HTCPage {
  readonly backLink: Locator;
  readonly pageHeader: Locator;
  readonly continueButton: Locator;
  readonly never: Locator;
  readonly monthlyOrLess: Locator;
  readonly twoToFourTimesAMonth: Locator;
  readonly twoToThreeTimesAWeek: Locator;
  readonly fourOrMoreTimesAWeek: Locator;
  readonly howOftenDoYouHaveDrinkErrorLink: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.never = page.locator('#alcohol-how-often-1');
    this.monthlyOrLess = page.locator('#alcohol-how-often-2');
    this.twoToFourTimesAMonth = page.locator('#alcohol-how-often-3');
    this.twoToThreeTimesAWeek = page.locator('#alcohol-how-often-4');
    this.fourOrMoreTimesAWeek = page.locator('#alcohol-how-often-5');
    this.continueButton = page.getByText('Continue');
    this.backLink = page.getByText('Back');
    this.pageHeader = page.locator(
      'h1:has-text("How often do you have a drink containing alcohol?")'
    );
    this.howOftenDoYouHaveDrinkErrorLink = page.getByRole('link', {
      name: 'Select how often you have a drink containing alcohol'
    });
    this.errorMessage = page.getByText('Error: Select how often you have');
  }

  async selectFrequency(frequency: AlcoholHowOften): Promise<void> {
    switch (frequency) {
      case AlcoholHowOften.Never:
        await this.clickNever();
        break;
      case AlcoholHowOften.MonthlyOrLess:
        await this.clickMonthlyOrLess();
        break;
      case AlcoholHowOften.TwoToFourTimesAMonth:
        await this.clickTwoToFourTimesAMonth();
        break;
      case AlcoholHowOften.TwoToThreeTimesAWeek:
        await this.clickTwoToThreeTimesAWeek();
        break;
      case AlcoholHowOften.FourTimesOrMoreAWeek:
        await this.clickFourOrMoreTimesAWeek();
        break;
      default:
        throw new Error('Unknown frequency');
    }
  }

  async clickNever(): Promise<void> {
    await this.never.click();
  }

  async clickMonthlyOrLess(): Promise<void> {
    await this.monthlyOrLess.click();
  }

  async clickTwoToFourTimesAMonth(): Promise<void> {
    await this.twoToFourTimesAMonth.click();
  }

  async clickTwoToThreeTimesAWeek(): Promise<void> {
    await this.twoToThreeTimesAWeek.click();
  }

  async clickFourOrMoreTimesAWeek(): Promise<void> {
    await this.fourOrMoreTimesAWeek.click();
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
    return pageTitlesMap[JourneyStepNames.AlcoholOftenPage];
  }
}
