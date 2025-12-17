import { TaskListPage } from '../TaskListPage';
import { type Page } from '@playwright/test';
import { AboutYouPages } from '../AboutYouPages/AboutYouPagesHelper';
import { BodyMeasurementsPages } from './BodyMeasurementsPagesHelper';
import type {
  AsianOrAsianBritish,
  EthnicBackground,
  EthnicBackgroundOther
} from '@dnhc-health-checks/shared';

interface BMITestData {
  ethnicBackground: EthnicBackground;
  detailedEthnic: AsianOrAsianBritish | EthnicBackgroundOther;
  weight: string;
  height: string;
  waistMeasurement: string;
}

export default class BodyMeasurementsBMIHelper {
  public async fillAboutYouAndBodyMeasurementsSectionWithData(
    bmiTestData: BMITestData,
    page: Page
  ): Promise<void> {
    const taskListPage = new TaskListPage(page);
    const aboutYouPages = new AboutYouPages(page);
    const bodyMeasurementPages = new BodyMeasurementsPages(page);

    await taskListPage.clickAboutYouLink();
    await aboutYouPages.townsendPostcodePage.waitUntilLoaded();
    await aboutYouPages.townsendPostcodePage.clickContinueButton();
    await aboutYouPages.familyHeartAttackHistoryPage.waitUntilLoaded();
    await aboutYouPages.familyHeartAttackHistoryPage.clickContinueButton();
    await aboutYouPages.familyDiabetesHistoryPage.waitUntilLoaded();
    await aboutYouPages.familyDiabetesHistoryPage.clickContinueButton();
    await aboutYouPages.sexAssignedAtBirthPage.waitUntilLoaded();
    await aboutYouPages.sexAssignedAtBirthPage.clickContinueButton();
    await aboutYouPages.ethnicGroupPage.waitUntilLoaded();
    await aboutYouPages.ethnicGroupPage.checkRadioButton(
      bmiTestData.ethnicBackground
    );
    await aboutYouPages.ethnicGroupPage.clickContinueButton();
    await aboutYouPages.detailedEthnicGroupAsianPage.waitUntilLoaded();
    await aboutYouPages.detailedEthnicGroupAsianPage.checkRadioButton(
      bmiTestData.detailedEthnic
    );
    await aboutYouPages.detailedEthnicGroupAsianPage.clickContinueButton();
    await aboutYouPages.doYouSmokePage.waitUntilLoaded();
    await aboutYouPages.doYouSmokePage.clickContinueButton();
    await aboutYouPages.lupusPage.waitUntilLoaded();
    await aboutYouPages.lupusPage.clickContinueButton();
    await aboutYouPages.severeMentalIllnessPage.waitUntilLoaded();
    await aboutYouPages.severeMentalIllnessPage.clickContinueButton();
    await aboutYouPages.antipsychoticMedicationPage.waitUntilLoaded();
    await aboutYouPages.antipsychoticMedicationPage.clickContinueButton();
    await aboutYouPages.migrainesPage.waitUntilLoaded();
    await aboutYouPages.migrainesPage.clickContinueButton();
    await aboutYouPages.erectileDysfunctionPage.waitUntilLoaded();
    await aboutYouPages.erectileDysfunctionPage.clickContinueButton();
    await aboutYouPages.steroidPage.waitUntilLoaded();
    await aboutYouPages.steroidPage.clickContinueButton();
    await aboutYouPages.rheumatoidArthritisPage.waitUntilLoaded();
    await aboutYouPages.rheumatoidArthritisPage.clickContinueButton();
    await aboutYouPages.checkYourAnswersPage.waitUntilLoaded();
    await aboutYouPages.checkYourAnswersPage.clickSaveContinueButton();
    await taskListPage.waitUntilLoaded();
    await taskListPage.clickEnterBodyMeasurementsLink();
    await bodyMeasurementPages.whatIsYourHeightPage.inputValueInCentimetres(
      bmiTestData.height
    );
    await bodyMeasurementPages.whatIsYourHeightPage.clickContinueButton();
    await bodyMeasurementPages.whatIsYourWeightPage.waitUntilLoaded();
    await bodyMeasurementPages.whatIsYourWeightPage.inputValueInKilograms(
      bmiTestData.weight
    );
    await bodyMeasurementPages.whatIsYourWeightPage.clickContinueButton();
    await bodyMeasurementPages.measureYourWaistPage.waitUntilLoaded();
    await bodyMeasurementPages.measureYourWaistPage.clickContinueButton();
    await bodyMeasurementPages.whatIsYourWaistMeasurementPage.waitUntilLoaded();
    await bodyMeasurementPages.whatIsYourWaistMeasurementPage.inputValueInCentimetres(
      bmiTestData.waistMeasurement
    );
    await bodyMeasurementPages.whatIsYourWaistMeasurementPage.clickContinueButton();
    await taskListPage.goToTaskListPageAndWaitForLoading();
  }
}
