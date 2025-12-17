import { type Locator, type Page } from '@playwright/test';
import { JourneyStepNames, pageTitlesMap } from '../../route-paths';
import { HTCPage } from '../HTCPage';
import { AlcoholDailyUnits } from '../../lib/enum/health-check-answers';

export class HowManyUnitsOfAlcoholPage extends HTCPage {
  readonly backLink: Locator;
  readonly pageHeader: Locator;
  readonly continueButton: Locator;
  readonly zeroToTwo: Locator;
  readonly threeToFour: Locator;
  readonly fiveToSix: Locator;
  readonly sevenToNine: Locator;
  readonly tenOrMore: Locator;
  readonly whatIsAUnitOfAlcoholLink: Locator;
  readonly unitOfAlcoholDefinition: Locator;
  readonly howManyUnitsErrorLink: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.zeroToTwo = page.locator('#alcohol-units-1');
    this.threeToFour = page.locator('#alcohol-units-2');
    this.fiveToSix = page.locator('#alcohol-units-3');
    this.sevenToNine = page.locator('#alcohol-units-4');
    this.tenOrMore = page.locator('#alcohol-units-5');
    this.whatIsAUnitOfAlcoholLink = page.getByText(
      'What is a unit of alcohol?'
    );
    this.unitOfAlcoholDefinition = page.getByText(
      '1 unit of alcohol is equal to'
    );
    this.continueButton = page.getByText('Continue');
    this.backLink = page.getByText('Back');
    this.pageHeader = page.locator(
      'h1:has-text("On a typical day when you drink alcohol")'
    );
    this.howManyUnitsErrorLink = page.getByRole('link', {
      name: 'Select how many units you have on a typical day'
    });
    this.errorMessage = page.getByText('Error: Select how many units');
  }

  async selectFrequency(data: AlcoholDailyUnits): Promise<void> {
    switch (data) {
      case AlcoholDailyUnits.ZeroToTwo:
        await this.clickZeroToTwo();
        break;
      case AlcoholDailyUnits.ThreeToFour:
        await this.clickThreeToFour();
        break;
      case AlcoholDailyUnits.FiveToSix:
        await this.clickFiveToSix();
        break;
      case AlcoholDailyUnits.SevenToNine:
        await this.clickSevenToNine();
        break;
      case AlcoholDailyUnits.TenOrMore:
        await this.clickTenOrMore();
        break;
      default:
        throw new Error('Unknown frequency');
    }
  }
  async clickZeroToTwo(): Promise<void> {
    await this.zeroToTwo.click();
  }

  async clickThreeToFour(): Promise<void> {
    await this.threeToFour.click();
  }

  async clickFiveToSix(): Promise<void> {
    await this.fiveToSix.click();
  }

  async clickSevenToNine(): Promise<void> {
    await this.sevenToNine.click();
  }

  async clickTenOrMore(): Promise<void> {
    await this.tenOrMore.click();
  }

  async clickWhatIsAUnitOfAlcoholLink(): Promise<void> {
    await this.whatIsAUnitOfAlcoholLink.click();
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
    return pageTitlesMap[JourneyStepNames.AlcoholTypicalUnitsPage];
  }
}
