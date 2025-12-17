import { type Locator, type Page } from '@playwright/test';
import { JourneyStepNames, pageTitlesMap } from '../../route-paths';
import { HTCPage } from '../HTCPage';
import { AlcoholEventsFrequency } from '../../lib/enum/health-check-answers';

export class SixOrMoreUnitsOfAlcoholPage extends HTCPage {
  readonly backLink: Locator;
  readonly pageHeader: Locator;
  readonly continueButton: Locator;
  readonly neverRadioButton: Locator;
  readonly lessThanMonthlyRadioButton: Locator;
  readonly monthlyRadioButton: Locator;
  readonly weeklyRadioButton: Locator;
  readonly dailyOrAlmostDailyRadioButton: Locator;
  readonly howOftenSixUnitsInThePastErrorLink: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.neverRadioButton = page.locator('#alcohol-occasional-units-1');
    this.lessThanMonthlyRadioButton = page.locator(
      '#alcohol-occasional-units-2'
    );
    this.monthlyRadioButton = page.locator('#alcohol-occasional-units-3');
    this.weeklyRadioButton = page.locator('#alcohol-occasional-units-4');
    this.dailyOrAlmostDailyRadioButton = page.locator(
      '#alcohol-occasional-units-5'
    );
    this.continueButton = page.getByText('Continue');
    this.backLink = page.getByText('Back');
    this.pageHeader = page.locator(
      'h1:has-text("In the past year, how often have you had 6 or more alcohol units ")'
    );
    this.howOftenSixUnitsInThePastErrorLink = page.getByRole('link', {
      name: "Select how often in the past year you've had 6 or more alcohol units (if you're female) or 8 or more units (if male) on a single occasion"
    });
    this.errorMessage = page.getByText(
      'Error: Select how often in the past year'
    );
  }

  async selectFrequency(option: AlcoholEventsFrequency): Promise<void> {
    let radioButton: Locator;
    switch (option) {
      case AlcoholEventsFrequency.Never:
        radioButton = this.neverRadioButton;
        break;
      case AlcoholEventsFrequency.LessThanMonthly:
        radioButton = this.lessThanMonthlyRadioButton;
        break;
      case AlcoholEventsFrequency.Monthly:
        radioButton = this.monthlyRadioButton;
        break;
      case AlcoholEventsFrequency.Weekly:
        radioButton = this.weeklyRadioButton;
        break;
      case AlcoholEventsFrequency.DailyOrAlmost:
        radioButton = this.dailyOrAlmostDailyRadioButton;
        break;
      default:
        throw new Error('Unsupported option');
    }
    await radioButton.check();
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
    return pageTitlesMap[JourneyStepNames.AlcoholOccasionUnitsPage];
  }
}
