import { type Page } from '@playwright/test';
import { BaseSectionFlow } from '../BaseSectionFlow';
import { TaskListPage } from '../../../page-objects/TaskListPage';
import { BodyMeasurementsPages } from '../../../page-objects/BodyMeasurementsPages/BodyMeasurementsPagesHelper';
import type { BodyMeasurementsSectionFlowData } from './BodyMeasurementsSectionDataFactory';

export class BodyMeasurementsSectionFlow extends BaseSectionFlow<BodyMeasurementsSectionFlowData> {
  private readonly bodyMeasurementPages: BodyMeasurementsPages;
  private readonly taskListPage: TaskListPage;

  constructor(
    data: BodyMeasurementsSectionFlowData,
    page: Page,
    withAccessibility: boolean = false
  ) {
    super(data, page, withAccessibility);

    this.bodyMeasurementPages = new BodyMeasurementsPages(page);
    this.taskListPage = new TaskListPage(page);
    this.withAccessibility = withAccessibility;
  }

  public async completeSection(): Promise<void> {
    await this.taskListPage.clickEnterBodyMeasurementsLink();
    await this.completeWhatIsYourHeightPage();
    await this.completeWhatIsYourWeightPage();
    await this.completeMeasureYourWaistPage();
    await this.completeWhatIsYourWaistMeasurementPage();
    await this.submitOnCheckYourAnswersPage();
    await this.taskListPage.waitUntilLoaded();

    this.verifyAccessibilityErrors();
  }

  private async completeWhatIsYourHeightPage(): Promise<void> {
    await this.bodyMeasurementPages.whatIsYourHeightPage.waitUntilLoaded();
    await this.runAccessibilityCheck(
      this.bodyMeasurementPages.whatIsYourHeightPage,
      'BodyMeasurements-WhatIsYourHeight'
    );
    if (this.data.heightInCm !== undefined) {
      await this.bodyMeasurementPages.whatIsYourHeightPage.inputValueInCentimetres(
        this.data.heightInCm as string
      );
    } else {
      await this.bodyMeasurementPages.whatIsYourHeightPage.inputValueInFeetAndInches(
        this.data.heightInFeet as string,
        this.data.heightInInches as string
      );
    }
    await this.bodyMeasurementPages.whatIsYourHeightPage.clickContinueButton();
  }

  private async completeWhatIsYourWeightPage(): Promise<void> {
    await this.bodyMeasurementPages.whatIsYourWeightPage.waitUntilLoaded();
    await this.runAccessibilityCheck(
      this.bodyMeasurementPages.whatIsYourWeightPage,
      'BodyMeasurements-WhatIsYourWeight'
    );
    if (this.data.weightInKg !== undefined) {
      await this.bodyMeasurementPages.whatIsYourWeightPage.inputValueInKilograms(
        this.data.weightInKg as string
      );
    } else {
      await this.bodyMeasurementPages.whatIsYourWeightPage.inputValueInStonesAndPounds(
        this.data.weightInStones as string,
        this.data.weightInPounds as string
      );
    }
    await this.bodyMeasurementPages.whatIsYourWeightPage.clickContinueButton();
  }

  private async completeMeasureYourWaistPage(): Promise<void> {
    await this.bodyMeasurementPages.measureYourWaistPage.waitUntilLoaded();
    await this.runAccessibilityCheck(
      this.bodyMeasurementPages.measureYourWaistPage,
      'BodyMeasurements-MeasureYourWaist'
    );
    await this.bodyMeasurementPages.measureYourWaistPage.clickContinueButton();
  }

  private async completeWhatIsYourWaistMeasurementPage(): Promise<void> {
    await this.bodyMeasurementPages.whatIsYourWaistMeasurementPage.waitUntilLoaded();
    await this.runAccessibilityCheck(
      this.bodyMeasurementPages.whatIsYourWaistMeasurementPage,
      'BodyMeasurements-WhatIsYourWaistMeasurement'
    );
    if (this.data.waistMeasurementInCm !== undefined) {
      await this.bodyMeasurementPages.whatIsYourWaistMeasurementPage.inputValueInCentimetres(
        this.data.waistMeasurementInCm as string
      );
    } else {
      await this.bodyMeasurementPages.whatIsYourWaistMeasurementPage.inputValueInInches(
        this.data.waistMeasurementInInches as string
      );
    }
    await this.bodyMeasurementPages.whatIsYourWaistMeasurementPage.clickContinueButton();
  }

  private async submitOnCheckYourAnswersPage(): Promise<void> {
    await this.bodyMeasurementPages.checkYourAnswersPage.waitUntilLoaded();
    await this.runAccessibilityCheck(
      this.bodyMeasurementPages.checkYourAnswersPage,
      'BodyMeasurements-CheckYourAnswers'
    );
    await this.bodyMeasurementPages.checkYourAnswersPage.clickSaveContinueButton();
  }
}
