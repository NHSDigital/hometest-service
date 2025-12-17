import { type Page } from '@playwright/test';
import { BaseSectionFlow } from '../BaseSectionFlow';
import { TaskListPage } from '../../../page-objects/TaskListPage';
import { AboutYouPages } from '../../../page-objects/AboutYouPages/AboutYouPagesHelper';
import type { AboutYouSectionDataFlow } from './AboutYouSectionDataFactory';
import { EthnicBackground, Sex } from '@dnhc-health-checks/shared';

export class AboutYouSectionFlow extends BaseSectionFlow<AboutYouSectionDataFlow> {
  protected withTaskListPage: boolean;
  private readonly aboutYouPages: AboutYouPages;
  private readonly taskListPage: TaskListPage;

  constructor(
    data: AboutYouSectionDataFlow,
    page: Page,
    withAccessibility: boolean = false,
    withTaskListPage: boolean = true
  ) {
    super(data, page, withAccessibility);

    this.aboutYouPages = new AboutYouPages(page);
    this.taskListPage = new TaskListPage(page);
    this.withTaskListPage = withTaskListPage;
    this.withAccessibility = withAccessibility;
  }

  public async completeSection(): Promise<void> {
    await this.taskListPage.clickAboutYouLink();
    await this.completeTownsendPostcodePage();
    await this.completeFamilyHeartAttackHistoryPage();
    await this.completeFamilyDiabetesHistoryPage();
    await this.completeSexAssignedAtBirthPage();
    await this.completeEthnicGroupPage();
    await this.completeDetailedEthnicGroupPage(this.data.ethnicGroup);
    await this.completeSmokingPage();
    await this.completeLupusPage();
    await this.completeSevereMentalIllnessPage();
    await this.completeAntipsychoticMedicationPage();
    await this.completeMigrainesMedicationPage();
    if (this.data.sexAssignedAtBirth === Sex.Male) {
      await this.completeErectileDysfunctionPage();
    }
    await this.completeSteroidPage();
    await this.completeRheumatoidArthritisPage();
    await this.waitUntilCheckYourAnswerPageLoaded();
    if (this.withTaskListPage !== false) {
      await this.submitOnCheckYourAnswersPage();
      await this.taskListPage.waitUntilLoaded();
    }

    this.verifyAccessibilityErrors();
  }

  private async completeTownsendPostcodePage(): Promise<void> {
    await this.aboutYouPages.townsendPostcodePage.waitUntilLoaded();
    await this.runAccessibilityCheck(
      this.aboutYouPages.townsendPostcodePage,
      'AboutYou-TownsendPostcode'
    );
    if (this.data.townsendPostcode !== null) {
      await this.aboutYouPages.townsendPostcodePage.fillPostcodeField(
        this.data.townsendPostcode
      );
    }
    await this.aboutYouPages.townsendPostcodePage.clickContinueButton();
  }

  private async completeFamilyHeartAttackHistoryPage(): Promise<void> {
    await this.aboutYouPages.familyHeartAttackHistoryPage.waitUntilLoaded();
    await this.runAccessibilityCheck(
      this.aboutYouPages.familyHeartAttackHistoryPage,
      'AboutYou-FamilyHeartAttackHistory'
    );
    await this.aboutYouPages.familyHeartAttackHistoryPage.selectHeartAttackOptionAndClickContinue(
      this.data.familyHeartAttackHistory
    );
  }

  private async completeFamilyDiabetesHistoryPage(): Promise<void> {
    await this.aboutYouPages.familyDiabetesHistoryPage.waitUntilLoaded();
    await this.runAccessibilityCheck(
      this.aboutYouPages.familyDiabetesHistoryPage,
      'AboutYou-FamilyDiabetesHistory'
    );
    await this.aboutYouPages.familyDiabetesHistoryPage.selectDiabetesOptionsAndClickContinue(
      this.data.familyDiabetesHistory
    );
  }

  private async completeSexAssignedAtBirthPage(): Promise<void> {
    await this.aboutYouPages.sexAssignedAtBirthPage.waitUntilLoaded();
    await this.runAccessibilityCheck(
      this.aboutYouPages.sexAssignedAtBirthPage,
      'AboutYou-SexAssignedAtBirth'
    );
    await this.aboutYouPages.sexAssignedAtBirthPage.selectSexAssignedAtBirthOptionsAndClickContinue(
      this.data.sexAssignedAtBirth
    );
  }

  private async completeEthnicGroupPage(): Promise<void> {
    await this.aboutYouPages.ethnicGroupPage.waitUntilLoaded();
    await this.runAccessibilityCheck(
      this.aboutYouPages.ethnicGroupPage,
      'AboutYou-EthnicGroup'
    );
    await this.aboutYouPages.ethnicGroupPage.selectEthnicAndClickContinueButton(
      this.data.ethnicGroup
    );
  }

  private async completeDetailedEthnicGroupPage(
    option: EthnicBackground
  ): Promise<void> {
    switch (option) {
      case EthnicBackground.AsianOrAsianBritish:
        await this.aboutYouPages.detailedEthnicGroupAsianPage.waitUntilLoaded();
        await this.runAccessibilityCheck(
          this.aboutYouPages.detailedEthnicGroupAsianPage,
          'AboutYou-DetailedEthnicGroupAsian'
        );
        await this.aboutYouPages.detailedEthnicGroupAsianPage.selectDetailedEthnicAsianGroupAndClickContinue(
          this.data.detailedEthnicGroupAsian
        );
        break;
      case EthnicBackground.White:
        await this.aboutYouPages.detailedEthnicGroupWhitePage.waitUntilLoaded();
        await this.runAccessibilityCheck(
          this.aboutYouPages.detailedEthnicGroupWhitePage,
          'AboutYou-DetailedEthnicGroupWhite'
        );
        await this.aboutYouPages.detailedEthnicGroupWhitePage.selectDetailedEthnicWhiteGroupAndClickContinue(
          this.data.detailedEthnicGroupWhite
        );
        break;
      case EthnicBackground.Other:
        await this.aboutYouPages.detailedOtherEthnicGroupPage.waitUntilLoaded();
        await this.runAccessibilityCheck(
          this.aboutYouPages.detailedOtherEthnicGroupPage,
          'AboutYou-DetailedOtherEthnicGroup'
        );
        await this.aboutYouPages.detailedOtherEthnicGroupPage.selectDetailedEthnicOtherGroupAndClickContinue(
          this.data.detailedOtherEthnicGroup
        );
        break;
    }
  }

  private async completeSmokingPage(): Promise<void> {
    await this.aboutYouPages.doYouSmokePage.waitUntilLoaded();
    await this.runAccessibilityCheck(
      this.aboutYouPages.doYouSmokePage,
      'AboutYou-DoYouSmoke'
    );
    await this.aboutYouPages.doYouSmokePage.selectSmokingOptionAndClickContinue(
      this.data.doYouSmoke
    );
  }

  private async completeLupusPage(): Promise<void> {
    await this.aboutYouPages.lupusPage.waitUntilLoaded();
    await this.runAccessibilityCheck(
      this.aboutYouPages.lupusPage,
      'AboutYou-Lupus'
    );
    await this.aboutYouPages.lupusPage.selectLupusOptionAndClickContinue(
      this.data.lupus
    );
  }

  private async completeSevereMentalIllnessPage(): Promise<void> {
    await this.aboutYouPages.severeMentalIllnessPage.waitUntilLoaded();
    await this.runAccessibilityCheck(
      this.aboutYouPages.severeMentalIllnessPage,
      'AboutYou-SevereMentalIllness'
    );
    await this.aboutYouPages.severeMentalIllnessPage.selectSevereMentalIllnessOptionAndClickContinue(
      this.data.severeMentalIllness
    );
  }

  private async completeAntipsychoticMedicationPage(): Promise<void> {
    await this.aboutYouPages.antipsychoticMedicationPage.waitUntilLoaded();
    await this.runAccessibilityCheck(
      this.aboutYouPages.antipsychoticMedicationPage,
      'AboutYou-AntipsychoticMedication'
    );
    await this.aboutYouPages.antipsychoticMedicationPage.selectAntipsychoticMedicationOptionAndClickContinue(
      this.data.antipsychoticMedication
    );
  }

  private async completeMigrainesMedicationPage(): Promise<void> {
    await this.aboutYouPages.migrainesPage.waitUntilLoaded();
    await this.runAccessibilityCheck(
      this.aboutYouPages.migrainesPage,
      'AboutYou-Migraines'
    );
    await this.aboutYouPages.migrainesPage.selectMigrainesOptionAndClickContinue(
      this.data.migraines
    );
  }

  private async completeErectileDysfunctionPage(): Promise<void> {
    if (this.data.erectileDysfunction !== undefined) {
      await this.aboutYouPages.erectileDysfunctionPage.waitUntilLoaded();
      await this.runAccessibilityCheck(
        this.aboutYouPages.erectileDysfunctionPage,
        'AboutYou-ErectileDysfunction'
      );
      await this.aboutYouPages.erectileDysfunctionPage.selectErectileDysfunctionOptionAndClickContinue(
        this.data.erectileDysfunction
      );
    }
  }

  private async completeSteroidPage(): Promise<void> {
    await this.aboutYouPages.steroidPage.waitUntilLoaded();
    await this.runAccessibilityCheck(
      this.aboutYouPages.steroidPage,
      'AboutYou-Steroid'
    );
    await this.aboutYouPages.steroidPage.selectSteroidOptionAndClickContinue(
      this.data.steroid
    );
  }

  private async completeRheumatoidArthritisPage(): Promise<void> {
    await this.aboutYouPages.rheumatoidArthritisPage.waitUntilLoaded();
    await this.runAccessibilityCheck(
      this.aboutYouPages.rheumatoidArthritisPage,
      'AboutYou-RheumatoidArthritis'
    );
    await this.aboutYouPages.rheumatoidArthritisPage.selectRheumatoidArthritisOptionAndClickContinue(
      this.data.rheumatoidArthritis
    );
  }

  private async waitUntilCheckYourAnswerPageLoaded(): Promise<void> {
    await this.aboutYouPages.checkYourAnswersPage.waitUntilLoaded();
  }

  private async submitOnCheckYourAnswersPage(): Promise<void> {
    await this.runAccessibilityCheck(
      this.aboutYouPages.checkYourAnswersPage,
      'AboutYou-CheckYourAnswers'
    );
    await this.aboutYouPages.checkYourAnswersPage.clickSaveContinueButton();
  }
}
