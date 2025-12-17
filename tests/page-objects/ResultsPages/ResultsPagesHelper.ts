import { AlcoholResultsPage } from './AlcoholResultsPage';
import { BloodPressureResultsPage } from './BloodPressureResultsPage';
import { BMIResultsPage } from './BMIResultsPage';
import { CholesterolResultsPage } from './CholesterolResultsPage';
import { DiabetesResultsPage } from './DiabetesRiskResultsPage';
import { DementiaResultsPage } from './DementiaResultsPage';
import { MainResultsPage } from './MainResultsPage';
import { PhysicalActivityResultsPage } from './PhysicalActivityResultsPage';
import { SmokingResultsPage } from './SmokingResultsPage';
import { type Page } from '@playwright/test';

export class ResultsPages {
  readonly alcoholResultsPage: AlcoholResultsPage;
  readonly bloodPressureResultsPage: BloodPressureResultsPage;
  readonly bmiResultsPage: BMIResultsPage;
  readonly cholesterolResultsPage: CholesterolResultsPage;
  readonly diabetesResultsPage: DiabetesResultsPage;
  readonly dementiaResultsPage: DementiaResultsPage;
  readonly mainResultsPage: MainResultsPage;
  readonly physicalActivityResultsPage: PhysicalActivityResultsPage;
  readonly smokingResultsPage: SmokingResultsPage;

  constructor(page: Page) {
    this.alcoholResultsPage = new AlcoholResultsPage(page);
    this.bloodPressureResultsPage = new BloodPressureResultsPage(page);
    this.bmiResultsPage = new BMIResultsPage(page);
    this.cholesterolResultsPage = new CholesterolResultsPage(page);
    this.diabetesResultsPage = new DiabetesResultsPage(page);
    this.dementiaResultsPage = new DementiaResultsPage(page);
    this.mainResultsPage = new MainResultsPage(page);
    this.physicalActivityResultsPage = new PhysicalActivityResultsPage(page);
    this.smokingResultsPage = new SmokingResultsPage(page);
  }
}
