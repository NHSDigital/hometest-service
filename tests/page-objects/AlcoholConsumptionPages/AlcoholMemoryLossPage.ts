import { type Locator, type Page } from '@playwright/test';
import { JourneyStepNames, pageTitlesMap } from '../../route-paths';
import { HTCPage } from '../HTCPage';
import { AlcoholEventsFrequency } from '../../lib/enum/health-check-answers';

export class AlcoholMemoryLossPage extends HTCPage {
  readonly backLink: Locator;
  readonly pageHeader: Locator;
  readonly continueButton: Locator;
  readonly neverRadioButton: Locator;
  readonly lessThanMonthlyRadioButton: Locator;
  readonly monthlyRadioButton: Locator;
  readonly weeklyRadioButton: Locator;
  readonly dailyOrAlmostDailyRadioButton: Locator;
  readonly errorMessage: Locator;
  readonly memoryLossErrorLink: Locator;

  constructor(page: Page) {
    super(page);
    this.neverRadioButton = page.getByLabel('Never');
    this.lessThanMonthlyRadioButton = page.getByLabel('Less than monthly');
    this.monthlyRadioButton = page.getByLabel('Monthly', { exact: true });
    this.weeklyRadioButton = page.getByLabel('Weekly');
    this.dailyOrAlmostDailyRadioButton = page.getByLabel(
      'Daily or almost daily'
    );
    this.continueButton = page.getByText('Continue');
    this.backLink = page.getByText('Back');
    this.pageHeader = page.locator(
      'h1:has-text("In the past year, how often have you been unable to remember")'
    );
    this.memoryLossErrorLink = page.getByRole('link', {
      name: "Select how often in the past year you've been unable to remember what happened the night before because of your drinking"
    });
    this.errorMessage = page.getByText(
      'Error: Select how often in the past year you'
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
    await radioButton.click();
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
    return pageTitlesMap[JourneyStepNames.AlcoholMemoryLossPage];
  }
}
