import { HoursExercisedPage } from './HoursExercisedPage';
import { HoursWalkedPage } from './HoursWalkedPage';
import { HoursCycledPage } from './HoursCycledPage';
import { WorkActivityPage } from './WorkActivityPage';
import { HoursHouseworkPage } from './HoursHouseworkPage';
import { HoursGardeningPage } from './HoursGardeningPage';
import { WalkingPacePage } from './WalkingPacePage';
import { CheckYourAnswersPage } from './CheckYourAnswersPage';
import { type Page } from '@playwright/test';
import { EverydayMovementPage } from './EverydayMovementPage';

export class PhysicalActivityPages {
  readonly hoursExercisedPage: HoursExercisedPage;
  readonly hoursWalkedPage: HoursWalkedPage;
  readonly walkingPacePage: WalkingPacePage;
  readonly hoursCycledPage: HoursCycledPage;
  readonly workActivityPage: WorkActivityPage;
  readonly everydayMovementPage: EverydayMovementPage;
  readonly hoursHouseworkPage: HoursHouseworkPage;
  readonly hoursGardeningPage: HoursGardeningPage;
  readonly checkYourAnswersPage: CheckYourAnswersPage;

  constructor(page: Page) {
    this.hoursExercisedPage = new HoursExercisedPage(page);
    this.hoursWalkedPage = new HoursWalkedPage(page);
    this.walkingPacePage = new WalkingPacePage(page);
    this.hoursCycledPage = new HoursCycledPage(page);
    this.workActivityPage = new WorkActivityPage(page);
    this.everydayMovementPage = new EverydayMovementPage(page);
    this.hoursHouseworkPage = new HoursHouseworkPage(page);
    this.hoursGardeningPage = new HoursGardeningPage(page);
    this.checkYourAnswersPage = new CheckYourAnswersPage(page);
  }
}
