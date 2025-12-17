import { BaseSectionFlow } from '../BaseSectionFlow';
import { type Page } from '@playwright/test';
import { EligibilityPages } from '../../../page-objects/EligibilityPages/EligibilityPagesHelper';
import { TaskListPage } from '../../../page-objects/TaskListPage';
import { HaveYouCompletedOptions } from '../../../page-objects/EligibilityPages/HaveYouCompletedNhsHealthCheckPage';
import { PreExistingOptions } from '../../../page-objects/EligibilityPages/PreExistingHealthConditionsPage';
import { NeedToLeaveTheOnlineServiceOptions } from '../../../page-objects/EligibilityPages/WhoShouldNotUseThisOnlineServicePage';
import type { EligibilitySectionFlowData } from './EligibilitySectionDataFactory';
import { ReceivedInvitationOptions } from '../../../page-objects/EligibilityPages/ReceivedInvitationQueryPage';

export class EligibilitySectionFlow extends BaseSectionFlow<EligibilitySectionFlowData> {
  private readonly eligibilityPages: EligibilityPages;
  private readonly taskListPage: TaskListPage;

  constructor(
    data: EligibilitySectionFlowData,
    page: Page,
    withAccessibility?: boolean
  ) {
    super(data, page, withAccessibility);
    this.eligibilityPages = new EligibilityPages(page);
    this.taskListPage = new TaskListPage(page);
  }

  async completeSection(): Promise<void> {
    await this.eligibilityPages.receivedInvitationQueryPage.waitUntilLoaded();
    if (!this.data.userInvitedViaLink) {
      await this.completeReceivedInvitationPage();

      if (this.data.receivedInvitation === ReceivedInvitationOptions.NO) {
        await this.completeHaveYouCompletedPage();
        if (this.data.haveYouCompleted === HaveYouCompletedOptions.YES) {
          await this.verifyPreviousHealthCheckCompletedPage();
          return;
        }

        await this.completePreExistingHealthConditionsPage();
        if (this.data.preExistingHealthConditions === PreExistingOptions.YES) {
          await this.verifyPreExistingHealthConditionsNotEligiblePage();
          return;
        }
      }
    }

    await this.completeWhoShouldNotUseThisOnlineServicePage();
    if (
      this.data.needToLeaveTheOnlineService ===
      NeedToLeaveTheOnlineServiceOptions.YES
    ) {
      await this.verifyContactYourGPSurgeryPage();
      return;
    }

    await this.taskListPage.waitUntilLoaded();

    this.verifyAccessibilityErrors();
  }

  private async completeReceivedInvitationPage(): Promise<void> {
    await this.eligibilityPages.receivedInvitationQueryPage.waitUntilLoaded();
    await this.runAccessibilityCheck(
      this.eligibilityPages.receivedInvitationQueryPage,
      'Eligibility-ReceivedInvitation'
    );
    if (this.data.receivedInvitation === undefined) {
      throw new Error('receivedInvitation is required to complete this page');
    }
    await this.eligibilityPages.receivedInvitationQueryPage.selectOptionAndClickContinue(
      this.data.receivedInvitation
    );
  }

  private async verifyPreviousHealthCheckCompletedPage(): Promise<void> {
    await this.eligibilityPages.previousHealthCheckCompletedPage.waitUntilLoaded();
    await this.runAccessibilityCheck(
      this.eligibilityPages.previousHealthCheckCompletedPage,
      'Eligibility-PreviousHealthCheckCompleted'
    );
    await this.eligibilityPages.previousHealthCheckCompletedPage.clickFeedbackButton();
  }

  private async verifyPreExistingHealthConditionsNotEligiblePage(): Promise<void> {
    await this.eligibilityPages.preExistingHealthConditionsNotEligiblePage.waitUntilLoaded();
    await this.runAccessibilityCheck(
      this.eligibilityPages.preExistingHealthConditionsNotEligiblePage,
      'Eligibility-PreExistingHealthConditionsNotEligible'
    );
    await this.eligibilityPages.previousHealthCheckCompletedPage.clickFeedbackButton();
  }

  private async verifyContactYourGPSurgeryPage(): Promise<void> {
    await this.eligibilityPages.contactYourGPSurgeryAboutYourNHSHealthCheckPage.waitUntilLoaded();
    await this.runAccessibilityCheck(
      this.eligibilityPages.whoShouldNotUseThisOnlineServicePage,
      'Eligibility-ContactYorGPSurgery'
    );
    await this.eligibilityPages.previousHealthCheckCompletedPage.clickFeedbackButton();
  }

  private async completeHaveYouCompletedPage(): Promise<void> {
    await this.eligibilityPages.haveYouCompletedNhsHealthCheckPage.waitUntilLoaded();
    await this.runAccessibilityCheck(
      this.eligibilityPages.haveYouCompletedNhsHealthCheckPage,
      'Eligibility-HaveYouCompleted'
    );
    await this.eligibilityPages.haveYouCompletedNhsHealthCheckPage.selectOptionAndClickContinue(
      this.data.haveYouCompleted as HaveYouCompletedOptions
    );
  }

  private async completePreExistingHealthConditionsPage(): Promise<void> {
    await this.eligibilityPages.preExistingHealthConditionsPage.waitUntilLoaded();
    await this.runAccessibilityCheck(
      this.eligibilityPages.preExistingHealthConditionsPage,
      'Eligibility-PreExisting'
    );
    await this.eligibilityPages.preExistingHealthConditionsPage.selectPreExistingOptionsAndClickContinue(
      this.data.preExistingHealthConditions as PreExistingOptions
    );
  }

  private async completeWhoShouldNotUseThisOnlineServicePage(): Promise<void> {
    await this.eligibilityPages.whoShouldNotUseThisOnlineServicePage.waitUntilLoaded();
    await this.runAccessibilityCheck(
      this.eligibilityPages.whoShouldNotUseThisOnlineServicePage,
      'Eligibility-WhoShouldNotUse'
    );
    await this.eligibilityPages.whoShouldNotUseThisOnlineServicePage.selectOptionAndClickContinue(
      this.data.needToLeaveTheOnlineService
    );
  }

  private async completeReadDeclarationPage(): Promise<void> {
    await this.eligibilityPages.readDeclarationPage.waitUntilLoaded();
    await this.runAccessibilityCheck(
      this.eligibilityPages.readDeclarationPage,
      'Eligibility-ReadDeclaration'
    );
    if (this.data.completeNhsHealthCheck === undefined) {
      throw new Error(
        'completeNhsHealthCheck is required to complete this page'
      );
    }
    await this.eligibilityPages.readDeclarationPage.selectNhsHealthCheckOptionsAndClickContinue(
      this.data.completeNhsHealthCheck
    );

    await this.taskListPage.waitUntilLoaded();
  }

  async newUserFromInviteOrReminderCheckEligibility(): Promise<void> {
    await this.completeWhoShouldNotUseThisOnlineServicePage();
    if (
      this.data.needToLeaveTheOnlineService ===
      NeedToLeaveTheOnlineServiceOptions.YES
    ) {
      await this.verifyContactYourGPSurgeryPage();
      return;
    }
    await this.taskListPage.waitUntilLoaded();
  }
}
