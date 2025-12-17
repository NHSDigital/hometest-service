import { DoYouDrinkAlcoholPage } from './DoYouDrinkAlcoholPage';
import { HowOftenAlcoholPage } from './HowOftenAlcoholPage';
import { HowManyUnitsOfAlcoholPage } from './HowManyUnitsOfAlcoholPage';
import { AlcoholFailedObligationsPage } from './AlcoholFailedObligationsPage';
import { SixOrMoreUnitsOfAlcoholPage } from './SixOrMoreUnitsOfAlcoholPage';
import { AlcoholMorningDrinkPage } from './AlcoholMorningDrinkPage';
import { AlcoholGuiltPage } from './AlcoholGuiltPage';
import { AlcoholMemoryLossPage } from './AlcoholMemoryLossPage';
import { AlcoholInjuredPage } from './AlcoholInjuredPage';
import { AlcoholRelativeConcernedPage } from './AlcoholRelativeConcernedPage';
import { CheckYourAnswersPage } from './CheckYourAnswersPage';
import { UnableToStopDrinkingPage } from './UnableToStopDrinkingPage';
import { type Page } from '@playwright/test';

export class AlcoholConsumptionPages {
  readonly doYouDrinkAlcoholPage: DoYouDrinkAlcoholPage;
  readonly howOftenAlcoholPage: HowOftenAlcoholPage;
  readonly howManyUnitsOfAlcoholPage: HowManyUnitsOfAlcoholPage;
  readonly alcoholFailedObligationsPage: AlcoholFailedObligationsPage;
  readonly sixOrMoreUnitsOfAlcoholPage: SixOrMoreUnitsOfAlcoholPage;
  readonly alcoholMorningDrinkPage: AlcoholMorningDrinkPage;
  readonly alcoholGuiltPage: AlcoholGuiltPage;
  readonly alcoholMemoryLossPage: AlcoholMemoryLossPage;
  readonly alcoholInjuredPage: AlcoholInjuredPage;
  readonly alcoholRelativeConcernedPage: AlcoholRelativeConcernedPage;
  readonly checkYourAnswersPage: CheckYourAnswersPage;
  readonly unableToStopDrinkingPage: UnableToStopDrinkingPage;

  constructor(page: Page) {
    this.doYouDrinkAlcoholPage = new DoYouDrinkAlcoholPage(page);
    this.howOftenAlcoholPage = new HowOftenAlcoholPage(page);
    this.howManyUnitsOfAlcoholPage = new HowManyUnitsOfAlcoholPage(page);
    this.alcoholFailedObligationsPage = new AlcoholFailedObligationsPage(page);
    this.sixOrMoreUnitsOfAlcoholPage = new SixOrMoreUnitsOfAlcoholPage(page);
    this.alcoholMorningDrinkPage = new AlcoholMorningDrinkPage(page);
    this.alcoholGuiltPage = new AlcoholGuiltPage(page);
    this.alcoholMemoryLossPage = new AlcoholMemoryLossPage(page);
    this.alcoholInjuredPage = new AlcoholInjuredPage(page);
    this.alcoholRelativeConcernedPage = new AlcoholRelativeConcernedPage(page);
    this.checkYourAnswersPage = new CheckYourAnswersPage(page);
    this.unableToStopDrinkingPage = new UnableToStopDrinkingPage(page);
  }
}
