/* eslint-disable @typescript-eslint/no-unused-expressions */
import { TownsendPostcodePage } from './TownsendPostcodePage';
import { FamilyHeartAttackHistoryPage } from './FamilyHeartAttackHistoryPage';
import { FamilyDiabetesHistoryPage } from './FamilyDiabetesHistoryPage';
import { SexAssignedAtBirthPage } from './SexAssignedAtBirthPage';
import { EthnicGroupPage } from './EthnicGroupPage';
import { DetailedEthnicGroupAsianPage } from './DetailedEthnicGroupAsianPage';
import { DetailedEthnicGroupBlackPage } from './DetailedEthnicGroupBlackPage';
import { DetailedEthnicGroupMixedEthnicPage } from './DetailedEthnicGroupMixedEthnicPage';
import { DetailedEthnicGroupWhitePage } from './DetailedEthnicGroupWhitePage';
import { DetailedOtherEthnicGroupPage } from './DetailedOtherEthnicGroupPage';
import { DoYouSmokePage } from './DoYouSmokePage';
import { LupusPage } from './LupusPage';
import { SevereMentalIllnessPage } from './SevereMentalIllnessPage';
import { AntipsychoticMedicationPage } from './AntipsychoticMedicationPage';
import { MigrainesPage } from './MigrainesPage';
import { ErectileDysfunctionPage } from './ErectileDysfunctionPage';
import { SteroidPage } from './SteroidPage';
import { RheumatoidArthritisPage } from './RheumatoidArthritisPage';
import { CheckYourAnswersPage } from './CheckYourAnswerPage';
import { type Page } from '@playwright/test';
import {
  AsianOrAsianBritish,
  EthnicBackground
} from '@dnhc-health-checks/shared';

export class AboutYouPages {
  readonly checkYourAnswersPage: CheckYourAnswersPage;
  readonly townsendPostcodePage: TownsendPostcodePage;
  readonly familyHeartAttackHistoryPage: FamilyHeartAttackHistoryPage;
  readonly familyDiabetesHistoryPage: FamilyDiabetesHistoryPage;
  readonly sexAssignedAtBirthPage: SexAssignedAtBirthPage;
  readonly ethnicGroupPage: EthnicGroupPage;
  readonly detailedEthnicGroupAsianPage: DetailedEthnicGroupAsianPage;
  readonly detailedEthnicGroupBlackPage: DetailedEthnicGroupBlackPage;
  readonly detailedEthnicGroupMixedEthnicPage: DetailedEthnicGroupMixedEthnicPage;
  readonly detailedEthnicGroupWhitePage: DetailedEthnicGroupWhitePage;
  readonly detailedOtherEthnicGroupPage: DetailedOtherEthnicGroupPage;
  readonly doYouSmokePage: DoYouSmokePage;
  readonly lupusPage: LupusPage;
  readonly severeMentalIllnessPage: SevereMentalIllnessPage;
  readonly antipsychoticMedicationPage: AntipsychoticMedicationPage;
  readonly migrainesPage: MigrainesPage;
  readonly erectileDysfunctionPage: ErectileDysfunctionPage;
  readonly steroidPage: SteroidPage;
  readonly rheumatoidArthritisPage: RheumatoidArthritisPage;

  constructor(page: Page) {
    this.checkYourAnswersPage = new CheckYourAnswersPage(page);
    this.townsendPostcodePage = new TownsendPostcodePage(page);
    this.familyHeartAttackHistoryPage = new FamilyHeartAttackHistoryPage(page);
    this.familyDiabetesHistoryPage = new FamilyDiabetesHistoryPage(page);
    this.sexAssignedAtBirthPage = new SexAssignedAtBirthPage(page);
    this.ethnicGroupPage = new EthnicGroupPage(page);
    this.detailedEthnicGroupAsianPage = new DetailedEthnicGroupAsianPage(page);
    this.detailedEthnicGroupBlackPage = new DetailedEthnicGroupBlackPage(page);
    this.detailedEthnicGroupMixedEthnicPage =
      new DetailedEthnicGroupMixedEthnicPage(page);
    this.detailedEthnicGroupWhitePage = new DetailedEthnicGroupWhitePage(page);
    this.detailedOtherEthnicGroupPage = new DetailedOtherEthnicGroupPage(page);
    this.doYouSmokePage = new DoYouSmokePage(page);
    this.lupusPage = new LupusPage(page);
    this.severeMentalIllnessPage = new SevereMentalIllnessPage(page);
    this.antipsychoticMedicationPage = new AntipsychoticMedicationPage(page);
    this.migrainesPage = new MigrainesPage(page);
    this.erectileDysfunctionPage = new ErectileDysfunctionPage(page);
    this.steroidPage = new SteroidPage(page);
    this.rheumatoidArthritisPage = new RheumatoidArthritisPage(page);
  }
}

export default class AboutYouHelper {
  public async completeAboutYouQuestions(
    sex: string,
    page: Page
  ): Promise<void> {
    const aboutYouPages = new AboutYouPages(page);

    await aboutYouPages.townsendPostcodePage.clickContinueButton();

    await aboutYouPages.familyHeartAttackHistoryPage.waitUntilLoaded();
    await aboutYouPages.familyHeartAttackHistoryPage.clickNoRadioButton();
    await aboutYouPages.familyHeartAttackHistoryPage.clickContinueButton();

    await aboutYouPages.familyDiabetesHistoryPage.waitUntilLoaded();
    await aboutYouPages.familyDiabetesHistoryPage.clickNoRadioButton();
    await aboutYouPages.familyDiabetesHistoryPage.clickContinueButton();

    await aboutYouPages.sexAssignedAtBirthPage.waitUntilLoaded();
    sex === 'Female'
      ? await aboutYouPages.sexAssignedAtBirthPage.checkFemaleRadioButton()
      : await aboutYouPages.sexAssignedAtBirthPage.checkMaleRadioButton();
    await aboutYouPages.sexAssignedAtBirthPage.clickContinueButton();

    await aboutYouPages.ethnicGroupPage.waitUntilLoaded();
    await aboutYouPages.ethnicGroupPage.checkRadioButton(
      EthnicBackground.AsianOrAsianBritish
    );
    await aboutYouPages.ethnicGroupPage.clickContinueButton();

    await aboutYouPages.detailedEthnicGroupAsianPage.waitUntilLoaded();
    await aboutYouPages.detailedEthnicGroupAsianPage.checkRadioButton(
      AsianOrAsianBritish.Chinese
    );
    await aboutYouPages.detailedEthnicGroupAsianPage.clickContinueButton();

    await aboutYouPages.doYouSmokePage.waitUntilLoaded();
    await aboutYouPages.doYouSmokePage.clickNoIHaveNeverSmokedRadioButton();
    await aboutYouPages.doYouSmokePage.clickContinueButton();

    const radioConfirmationPages = [
      aboutYouPages.lupusPage,
      aboutYouPages.severeMentalIllnessPage,
      aboutYouPages.antipsychoticMedicationPage,
      aboutYouPages.migrainesPage,
      ...(sex === 'Male' ? [aboutYouPages.erectileDysfunctionPage] : []),
      aboutYouPages.steroidPage,
      aboutYouPages.rheumatoidArthritisPage
    ];

    for (const page of radioConfirmationPages) {
      await page.waitUntilLoaded();
      await page.clickNoRadioButton();
      await page.clickContinueButton();
    }
  }
}
