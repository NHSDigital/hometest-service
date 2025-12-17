import { BloodPressureVeryHighShutterPage } from './BloodPressureVeryHighShutterPage';
import { CheckYourAnswersPage } from './CheckYourAnswersPage';
import { CheckBloodPressurePage } from './CheckBloodPressurePage';
import { ConfirmBloodPressureLocationPage } from './ConfirmBloodPressureLocationPage';
import { ConfirmBloodPressureReadingsPage } from './ConfirmBloodPressureReadingsPage';
import { EnterYourReadingPage } from './EnterYourReadingPage';
import { LowBloodPressureShutterPage } from './LowBloodPressureShutterPage';
import { LowBloodPressureSymptomsPage } from './LowBloodPressureSymptomsPage';
import { NeedBloodPressurePage } from './NeedBloodPressurePage';
import { type Page } from '@playwright/test';

export class BloodPressurePages {
  readonly bloodPressureVeryHighShutterPage: BloodPressureVeryHighShutterPage;
  readonly checkYourAnswersPage: CheckYourAnswersPage;
  readonly checkBloodPressurePage: CheckBloodPressurePage;
  readonly confirmBloodPressureLocationPage: ConfirmBloodPressureLocationPage;
  readonly confirmBloodPressureReadingsPage: ConfirmBloodPressureReadingsPage;
  readonly enterYourReadingPage: EnterYourReadingPage;
  readonly lowBloodPressureShutterPage: LowBloodPressureShutterPage;
  readonly lowBloodPressureSymptomsPage: LowBloodPressureSymptomsPage;
  readonly needBloodPressurePage: NeedBloodPressurePage;

  constructor(page: Page) {
    this.bloodPressureVeryHighShutterPage =
      new BloodPressureVeryHighShutterPage(page);
    this.checkYourAnswersPage = new CheckYourAnswersPage(page);
    this.checkBloodPressurePage = new CheckBloodPressurePage(page);
    this.confirmBloodPressureLocationPage =
      new ConfirmBloodPressureLocationPage(page);
    this.confirmBloodPressureReadingsPage =
      new ConfirmBloodPressureReadingsPage(page);
    this.enterYourReadingPage = new EnterYourReadingPage(page);
    this.lowBloodPressureShutterPage = new LowBloodPressureShutterPage(page);
    this.lowBloodPressureSymptomsPage = new LowBloodPressureSymptomsPage(page);
    this.needBloodPressurePage = new NeedBloodPressurePage(page);
  }
}
