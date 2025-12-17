import { type Locator, type Page } from '@playwright/test';
import { JourneyStepNames, pageTitlesMap } from '../../route-paths';
import { HTCPage } from '../HTCPage';
import { DoYouDrinkAlcohol } from '../../lib/enum/health-check-answers';

export class DoYouDrinkAlcoholPage extends HTCPage {
  readonly continueButton: Locator;
  readonly backLink: Locator;
  readonly pageHeader: Locator;
  readonly yesIDrinkAlcoholRadioButton: Locator;
  readonly noIHaveNeverRadioButton: Locator;
  readonly noIUsedToDrinkRadioButton: Locator;
  readonly doYouDrinkAlcoholErrorLink: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.noIHaveNeverRadioButton = page.getByLabel(
      "No, I've never had a drink of"
    );
    this.noIUsedToDrinkRadioButton = page.getByLabel(
      'No, I used to drink alcohol'
    );
    this.yesIDrinkAlcoholRadioButton = page.getByLabel('Yes, I drink alcohol');
    this.continueButton = page.getByText('Continue');
    this.backLink = page.getByText('Back');
    this.pageHeader = page.locator('h1:has-text("Do you drink alcohol?")');
    this.doYouDrinkAlcoholErrorLink = page.getByRole('link', {
      name: 'Select if you drink alcohol'
    });
    this.errorMessage = page.getByText('Error: Select if you drink alcohol');
  }

  async checkNoIHaveNever(): Promise<void> {
    await this.noIHaveNeverRadioButton.check();
  }

  async checkNoIUsedToDrink(): Promise<void> {
    await this.noIUsedToDrinkRadioButton.check();
  }

  async checkYesIDrinkAlcohol(): Promise<void> {
    await this.yesIDrinkAlcoholRadioButton.check();
  }

  async selectOption(option: DoYouDrinkAlcohol): Promise<void> {
    switch (option) {
      case DoYouDrinkAlcohol.Never:
        await this.checkNoIHaveNever();
        break;
      case DoYouDrinkAlcohol.UsedTo:
        await this.checkNoIUsedToDrink();
        break;
      case DoYouDrinkAlcohol.Yes:
        await this.checkYesIDrinkAlcohol();
        break;
      default:
        throw new Error('Unknown option');
    }
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
    return pageTitlesMap[JourneyStepNames.AlcoholQuestionPage];
  }
}
