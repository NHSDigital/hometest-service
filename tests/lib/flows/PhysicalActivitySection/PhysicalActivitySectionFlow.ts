import { type Page } from '@playwright/test';
import { BaseSectionFlow } from '../BaseSectionFlow';
import { PhysicalActivityPages } from '../../../page-objects/PhysicalActivityPages/PhysicalActivityPagesHelper';
import { TaskListPage } from '../../../page-objects/TaskListPage';
import type { PhysicalActivitySectionFlowData } from './PhysicalActivitySectionDataFactory';

export class PhysicalActivitySectionFlow extends BaseSectionFlow<PhysicalActivitySectionFlowData> {
  private readonly physicalActivityPages: PhysicalActivityPages;
  private readonly taskListPage: TaskListPage;

  constructor(
    data: PhysicalActivitySectionFlowData,
    page: Page,
    withAccessibility: boolean = false
  ) {
    super(data, page, withAccessibility);
    this.physicalActivityPages = new PhysicalActivityPages(page);
    this.taskListPage = new TaskListPage(page);
  }

  public async completeSection(): Promise<void> {
    await this.taskListPage.clickPhysicalActivityLink();

    await this.completeHoursExercisedPage();
    await this.completeHoursWalkedPage();
    await this.completeWalkingPacePage();
    await this.completeHoursCycledPage();
    await this.completeWorkActivityPage();
    await this.completeEverydayMovementPage();
    await this.completeHoursHouseworkPage();
    await this.completeHoursGardeningPage();
    await this.completeCheckYourAnswersPage();

    await this.taskListPage.waitUntilLoaded();

    this.verifyAccessibilityErrors();
  }

  private async completeHoursExercisedPage(): Promise<void> {
    await this.physicalActivityPages.hoursExercisedPage.waitUntilLoaded();
    await this.runAccessibilityCheck(
      this.physicalActivityPages.hoursExercisedPage,
      'PhysicalActivity-HoursExercised'
    );
    await this.physicalActivityPages.hoursExercisedPage.selectExerciseOptionsAndClickContinue(
      this.data.hoursExercised
    );
  }

  private async completeHoursWalkedPage(): Promise<void> {
    await this.physicalActivityPages.hoursWalkedPage.waitUntilLoaded();
    await this.runAccessibilityCheck(
      this.physicalActivityPages.hoursWalkedPage,
      'PhysicalActivity-HoursWalked'
    );
    await this.physicalActivityPages.hoursWalkedPage.selectWalkOptionsAndClickContinue(
      this.data.hoursWalked
    );
  }

  private async completeWalkingPacePage(): Promise<void> {
    await this.physicalActivityPages.walkingPacePage.waitUntilLoaded();
    await this.runAccessibilityCheck(
      this.physicalActivityPages.walkingPacePage,
      'PhysicalActivity-WalkingPace'
    );
    await this.physicalActivityPages.walkingPacePage.selectWalkingPaceOptionsAndClickContinue(
      this.data.walkingPace
    );
  }

  private async completeHoursCycledPage(): Promise<void> {
    await this.physicalActivityPages.hoursCycledPage.waitUntilLoaded();
    await this.runAccessibilityCheck(
      this.physicalActivityPages.hoursCycledPage,
      'PhysicalActivity-HoursCycled'
    );
    await this.physicalActivityPages.hoursCycledPage.selectCycleOptionsAndClickContinue(
      this.data.hoursCycled
    );
  }

  private async completeWorkActivityPage(): Promise<void> {
    await this.physicalActivityPages.workActivityPage.waitUntilLoaded();
    await this.runAccessibilityCheck(
      this.physicalActivityPages.workActivityPage,
      'PhysicalActivity-WorkActivity'
    );
    await this.physicalActivityPages.workActivityPage.selectWorkActivityOptionsAndClickContinue(
      this.data.workActivity
    );
  }

  private async completeEverydayMovementPage(): Promise<void> {
    await this.physicalActivityPages.everydayMovementPage.waitUntilLoaded();
    await this.runAccessibilityCheck(
      this.physicalActivityPages.everydayMovementPage,
      'PhysicalActivity-EverydayMovement'
    );
    await this.physicalActivityPages.everydayMovementPage.clickContinueButton();
  }

  private async completeHoursHouseworkPage(): Promise<void> {
    await this.physicalActivityPages.hoursHouseworkPage.waitUntilLoaded();
    await this.runAccessibilityCheck(
      this.physicalActivityPages.hoursHouseworkPage,
      'PhysicalActivity-HoursHousework'
    );
    await this.physicalActivityPages.hoursHouseworkPage.selectHouseworkOptionsAndClickContinue(
      this.data.hoursHousework
    );
  }

  private async completeHoursGardeningPage(): Promise<void> {
    await this.physicalActivityPages.hoursGardeningPage.waitUntilLoaded();
    await this.runAccessibilityCheck(
      this.physicalActivityPages.hoursGardeningPage,
      'PhysicalActivity-HoursGardening'
    );
    await this.physicalActivityPages.hoursGardeningPage.selectGardeningOptionsAndClickContinue(
      this.data.hoursGardening
    );
  }

  private async completeCheckYourAnswersPage(): Promise<void> {
    await this.physicalActivityPages.checkYourAnswersPage.waitUntilLoaded();
    await this.runAccessibilityCheck(
      this.physicalActivityPages.checkYourAnswersPage,
      'PhysicalActivity-CheckYourAnswers'
    );
    await this.physicalActivityPages.checkYourAnswersPage.clickSaveContinueButton();
  }
}
