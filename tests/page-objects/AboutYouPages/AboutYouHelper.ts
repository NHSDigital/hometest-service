/* eslint-disable @typescript-eslint/no-unused-expressions */
import { TownsendPostcodePage } from './TownsendPostcodePage';
import { FamilyHeartAttackHistoryPage } from './FamilyHeartAttackHistoryPage';
import { FamilyDiabetesHistoryPage } from './FamilyDiabetesHistoryPage';
import { SexAssignedAtBirthPage } from './SexAssignedAtBirthPage';
import { EthnicGroupPage } from './EthnicGroupPage';
import { DetailedEthnicGroupAsianPage } from './DetailedEthnicGroupAsianPage';
import { DoYouSmokePage } from './DoYouSmokePage';
import { LupusPage } from './LupusPage';
import { SevereMentalIllnessPage } from './SevereMentalIllnessPage';
import { AntipsychoticMedicationPage } from './AntipsychoticMedicationPage';
import { MigrainesPage } from './MigrainesPage';
import { ErectileDysfunctionPage } from './ErectileDysfunctionPage';
import { SteroidPage } from './SteroidPage';
import { RheumatoidArthritisPage } from './RheumatoidArthritisPage';
import { type Page } from '@playwright/test';
import {
  AsianOrAsianBritish,
  EthnicBackground
} from '@dnhc-health-checks/shared';

export default class AboutYouHelper {
  public async completeAboutYouQuestions(
    sex: string,
    page: Page,
    postCode: string | null = null
  ): Promise<void> {
    const townsendPostcodePage = new TownsendPostcodePage(page);
    const familyHeartAttackHistoryPage = new FamilyHeartAttackHistoryPage(page);
    const familyDiabetesHistoryPage = new FamilyDiabetesHistoryPage(page);
    const sexAssignedAtBirthPage = new SexAssignedAtBirthPage(page);
    const ethnicGroupPage = new EthnicGroupPage(page);
    const detailedEthnicGroupAsianPage = new DetailedEthnicGroupAsianPage(page);
    const doYouSmokePage = new DoYouSmokePage(page);
    const lupusPage = new LupusPage(page);
    const severeMentalIllnessPage = new SevereMentalIllnessPage(page);
    const antipsychoticMedicationPage = new AntipsychoticMedicationPage(page);
    const migrainesPage = new MigrainesPage(page);
    const erectileDysfunctionPage = new ErectileDysfunctionPage(page);
    const steroidPage = new SteroidPage(page);
    const rheumatoidArthritisPage = new RheumatoidArthritisPage(page);

    if (postCode !== null) {
      await townsendPostcodePage.fillPostcodeField(postCode);
    }
    await townsendPostcodePage.clickContinueButton();

    await familyHeartAttackHistoryPage.waitUntilLoaded();
    await familyHeartAttackHistoryPage.clickNoRadioButton();
    await familyHeartAttackHistoryPage.clickContinueButton();

    await familyDiabetesHistoryPage.waitUntilLoaded();
    await familyDiabetesHistoryPage.clickNoRadioButton();
    await familyDiabetesHistoryPage.clickContinueButton();

    await sexAssignedAtBirthPage.waitUntilLoaded();
    sex === 'Female'
      ? await sexAssignedAtBirthPage.checkFemaleRadioButton()
      : await sexAssignedAtBirthPage.checkMaleRadioButton();
    await sexAssignedAtBirthPage.clickContinueButton();

    await ethnicGroupPage.waitUntilLoaded();
    await ethnicGroupPage.checkRadioButton(
      EthnicBackground.AsianOrAsianBritish
    );
    await ethnicGroupPage.clickContinueButton();

    await detailedEthnicGroupAsianPage.waitUntilLoaded();
    await detailedEthnicGroupAsianPage.checkRadioButton(
      AsianOrAsianBritish.Chinese
    );
    await detailedEthnicGroupAsianPage.clickContinueButton();

    await doYouSmokePage.waitUntilLoaded();
    await doYouSmokePage.clickNoIHaveNeverSmokedRadioButton();
    await doYouSmokePage.clickContinueButton();

    const radioConfirmationPages = [
      lupusPage,
      severeMentalIllnessPage,
      antipsychoticMedicationPage,
      migrainesPage,
      ...(sex === 'Male' ? [erectileDysfunctionPage] : []),
      steroidPage,
      rheumatoidArthritisPage
    ];

    for (const page of radioConfirmationPages) {
      await page.waitUntilLoaded();
      await page.clickNoRadioButton();
      await page.clickContinueButton();
    }
  }
}
