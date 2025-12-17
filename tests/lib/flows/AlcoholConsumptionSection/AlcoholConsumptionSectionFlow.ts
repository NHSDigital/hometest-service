import { type Page } from '@playwright/test';
import { BaseSectionFlow } from '../BaseSectionFlow';
import { DoYouDrinkAlcohol } from '../../enum/health-check-answers';
import { AlcoholConsumptionPages } from '../../../page-objects/AlcoholConsumptionPages/AlcoholConsumptionPagesHelper';
import { TaskListPage } from '../../../page-objects/TaskListPage';
import type { AlcoholConsumptionSectionFlowData } from './AlcoholConsumptionSectionDataFactory';

/* eslint-disable @typescript-eslint/no-non-null-assertion */
export class AlcoholConsumptionSectionFlow extends BaseSectionFlow<AlcoholConsumptionSectionFlowData> {
  private readonly alcoholConsumptionPages: AlcoholConsumptionPages;
  private readonly taskListPage: TaskListPage;

  constructor(
    data: AlcoholConsumptionSectionFlowData,
    page: Page,
    withAccessibility: boolean = false
  ) {
    super(data, page, withAccessibility);
    this.alcoholConsumptionPages = new AlcoholConsumptionPages(page);
    this.taskListPage = new TaskListPage(page);
  }

  public async completeSection(): Promise<void> {
    await this.taskListPage.clickAlcoholConsumptionLink();

    await this.completeDoYouDrinkAlcoholPage();

    if (this.data.drinksAlcohol !== DoYouDrinkAlcohol.Never) {
      await this.completeHowOftenAlcoholPage();
      await this.completeHowManyUnitsPage();
      await this.completeSixOrMoreUnitsPage();
      await this.completeUnableToStopDrinkingPage();
      await this.completeFailedObligationsPage();
      await this.completeMorningDrinkPage();
      await this.completeGuiltPage();
      await this.completeMemoryLossPage();
      await this.completeInjuredPage();
      await this.completeRelativeConcernedPage();
    }

    await this.submitOnCheckYourAnswersPage();
    await this.taskListPage.waitUntilLoaded();

    this.verifyAccessibilityErrors();
  }

  private async completeDoYouDrinkAlcoholPage(): Promise<void> {
    await this.alcoholConsumptionPages.doYouDrinkAlcoholPage.waitUntilLoaded();
    await this.runAccessibilityCheck(
      this.alcoholConsumptionPages.doYouDrinkAlcoholPage,
      'Alcohol-DoYouDrink'
    );
    await this.alcoholConsumptionPages.doYouDrinkAlcoholPage.selectOption(
      this.data.drinksAlcohol
    );
    await this.alcoholConsumptionPages.doYouDrinkAlcoholPage.clickContinueButton();
  }

  private async completeHowOftenAlcoholPage(): Promise<void> {
    await this.alcoholConsumptionPages.howOftenAlcoholPage.waitUntilLoaded();
    await this.runAccessibilityCheck(
      this.alcoholConsumptionPages.howOftenAlcoholPage,
      'Alcohol-HowOften'
    );
    await this.alcoholConsumptionPages.howOftenAlcoholPage.selectFrequency(
      this.data.howOften!
    );
    await this.alcoholConsumptionPages.howOftenAlcoholPage.clickContinueButton();
  }

  private async completeHowManyUnitsPage(): Promise<void> {
    await this.alcoholConsumptionPages.howManyUnitsOfAlcoholPage.waitUntilLoaded();
    await this.runAccessibilityCheck(
      this.alcoholConsumptionPages.howManyUnitsOfAlcoholPage,
      'Alcohol-HowManyUnits'
    );
    await this.alcoholConsumptionPages.howManyUnitsOfAlcoholPage.selectFrequency(
      this.data.howManyUnits!
    );
    await this.alcoholConsumptionPages.howManyUnitsOfAlcoholPage.clickContinueButton();
  }

  private async completeSixOrMoreUnitsPage(): Promise<void> {
    await this.alcoholConsumptionPages.sixOrMoreUnitsOfAlcoholPage.waitUntilLoaded();
    await this.runAccessibilityCheck(
      this.alcoholConsumptionPages.sixOrMoreUnitsOfAlcoholPage,
      'Alcohol-SixOrMoreUnits'
    );
    await this.alcoholConsumptionPages.sixOrMoreUnitsOfAlcoholPage.selectFrequency(
      this.data.sixOrMoreUnitsFrequency!
    );
    await this.alcoholConsumptionPages.sixOrMoreUnitsOfAlcoholPage.clickContinueButton();
  }

  private async completeUnableToStopDrinkingPage(): Promise<void> {
    await this.alcoholConsumptionPages.unableToStopDrinkingPage.waitUntilLoaded();
    await this.runAccessibilityCheck(
      this.alcoholConsumptionPages.unableToStopDrinkingPage,
      'Alcohol-UnableToStop'
    );
    await this.alcoholConsumptionPages.unableToStopDrinkingPage.selectFrequency(
      this.data.unableToStopFrequency!
    );
    await this.alcoholConsumptionPages.unableToStopDrinkingPage.clickContinueButton();
  }

  private async completeFailedObligationsPage(): Promise<void> {
    await this.alcoholConsumptionPages.alcoholFailedObligationsPage.waitUntilLoaded();
    await this.runAccessibilityCheck(
      this.alcoholConsumptionPages.alcoholFailedObligationsPage,
      'Alcohol-FailedObligations'
    );
    await this.alcoholConsumptionPages.alcoholFailedObligationsPage.selectFrequency(
      this.data.failedObligationsFrequency!
    );
    await this.alcoholConsumptionPages.alcoholFailedObligationsPage.clickContinueButton();
  }

  private async completeMorningDrinkPage(): Promise<void> {
    await this.alcoholConsumptionPages.alcoholMorningDrinkPage.waitUntilLoaded();
    await this.runAccessibilityCheck(
      this.alcoholConsumptionPages.alcoholMorningDrinkPage,
      'Alcohol-MorningDrink'
    );
    await this.alcoholConsumptionPages.alcoholMorningDrinkPage.selectFrequency(
      this.data.morningDrinkFrequency!
    );
    await this.alcoholConsumptionPages.alcoholMorningDrinkPage.clickContinueButton();
  }

  private async completeGuiltPage(): Promise<void> {
    await this.alcoholConsumptionPages.alcoholGuiltPage.waitUntilLoaded();
    await this.runAccessibilityCheck(
      this.alcoholConsumptionPages.alcoholGuiltPage,
      'Alcohol-Guilt'
    );
    await this.alcoholConsumptionPages.alcoholGuiltPage.selectFrequency(
      this.data.guiltFrequency!
    );
    await this.alcoholConsumptionPages.alcoholGuiltPage.clickContinueButton();
  }

  private async completeMemoryLossPage(): Promise<void> {
    await this.alcoholConsumptionPages.alcoholMemoryLossPage.waitUntilLoaded();
    await this.runAccessibilityCheck(
      this.alcoholConsumptionPages.alcoholMemoryLossPage,
      'Alcohol-MemoryLoss'
    );
    await this.alcoholConsumptionPages.alcoholMemoryLossPage.selectFrequency(
      this.data.memoryLossFrequency!
    );
    await this.alcoholConsumptionPages.alcoholMemoryLossPage.clickContinueButton();
  }

  private async completeInjuredPage(): Promise<void> {
    await this.alcoholConsumptionPages.alcoholInjuredPage.waitUntilLoaded();
    await this.runAccessibilityCheck(
      this.alcoholConsumptionPages.alcoholInjuredPage,
      'Alcohol-Injured'
    );
    await this.alcoholConsumptionPages.alcoholInjuredPage.selectInjuredPastYear(
      this.data.injuredPastYear!
    );
    await this.alcoholConsumptionPages.alcoholInjuredPage.clickContinueButton();
  }

  private async completeRelativeConcernedPage(): Promise<void> {
    await this.alcoholConsumptionPages.alcoholRelativeConcernedPage.waitUntilLoaded();
    await this.runAccessibilityCheck(
      this.alcoholConsumptionPages.alcoholRelativeConcernedPage,
      'Alcohol-RelativeConcerned'
    );
    await this.alcoholConsumptionPages.alcoholRelativeConcernedPage.selectOption(
      this.data.relativeConcernedPastYear!
    );
    await this.alcoholConsumptionPages.alcoholRelativeConcernedPage.clickContinueButton();
  }

  private async submitOnCheckYourAnswersPage(): Promise<void> {
    await this.alcoholConsumptionPages.checkYourAnswersPage.waitUntilLoaded();
    await this.runAccessibilityCheck(
      this.alcoholConsumptionPages.checkYourAnswersPage,
      'Alcohol-CheckYourAnswers'
    );
    await this.alcoholConsumptionPages.checkYourAnswersPage.clickSaveContinueButton();
  }
}
