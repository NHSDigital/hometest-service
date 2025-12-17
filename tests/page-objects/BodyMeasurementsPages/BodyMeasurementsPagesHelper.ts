import { type Page } from '@playwright/test';
import { CheckYourAnswersPage } from './CheckYourAnswersPage';
import { DiabetesShutterPage } from './DiabetesShutterPage';
import { MeasureYourWaistPage } from './MeasureYourWaistPage';
import { WhatIsYourHeightPage } from './WhatIsYourHeightPage';
import { WhatIsYourWaistMeasurementPage } from './WhatIsYourWaistMeasurementPage';
import { WhatIsYourWeightPage } from './WhatIsYourWeightPage';

export class BodyMeasurementsPages {
  readonly checkYourAnswersPage: CheckYourAnswersPage;
  readonly diabetesShutterPage: DiabetesShutterPage;
  readonly measureYourWaistPage: MeasureYourWaistPage;
  readonly whatIsYourHeightPage: WhatIsYourHeightPage;
  readonly whatIsYourWaistMeasurementPage: WhatIsYourWaistMeasurementPage;
  readonly whatIsYourWeightPage: WhatIsYourWeightPage;

  constructor(page: Page) {
    this.checkYourAnswersPage = new CheckYourAnswersPage(page);
    this.diabetesShutterPage = new DiabetesShutterPage(page);
    this.measureYourWaistPage = new MeasureYourWaistPage(page);
    this.whatIsYourHeightPage = new WhatIsYourHeightPage(page);
    this.whatIsYourWaistMeasurementPage = new WhatIsYourWaistMeasurementPage(
      page
    );
    this.whatIsYourWeightPage = new WhatIsYourWeightPage(page);
  }
}
