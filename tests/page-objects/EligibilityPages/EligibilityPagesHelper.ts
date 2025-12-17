import { type Page } from '@playwright/test';
import { ContactYourGPSurgeryAboutYourNHSHealthCheckPage } from './ContactYourGPSurgeryAboutYourNHSHealthCheckPage';
import { HaveYouCompletedNhsHealthCheckPage } from './HaveYouCompletedNhsHealthCheckPage';
import { PreExistingHealthConditionsNotEligiblePage } from './PreExistingHealthConditionsNotEligiblePage';
import { PreExistingHealthConditionsPage } from './PreExistingHealthConditionsPage';
import { PreviousHealthCheckCompletedPage } from './PreviousHealthCheckCompletedPage';
import { WhoShouldNotUseThisOnlineServicePage } from './WhoShouldNotUseThisOnlineServicePage';
import { ReadDeclarationPage } from '../DeclarationPages/ReadDeclarationPage';
import { ReceivedInvitationQueryPage } from './ReceivedInvitationQueryPage';

export class EligibilityPages {
  readonly contactYourGPSurgeryAboutYourNHSHealthCheckPage: ContactYourGPSurgeryAboutYourNHSHealthCheckPage;
  readonly haveYouCompletedNhsHealthCheckPage: HaveYouCompletedNhsHealthCheckPage;
  readonly preExistingHealthConditionsNotEligiblePage: PreExistingHealthConditionsNotEligiblePage;
  readonly preExistingHealthConditionsPage: PreExistingHealthConditionsPage;
  readonly previousHealthCheckCompletedPage: PreviousHealthCheckCompletedPage;
  readonly whoShouldNotUseThisOnlineServicePage: WhoShouldNotUseThisOnlineServicePage;
  readonly receivedInvitationQueryPage: ReceivedInvitationQueryPage;
  readonly readDeclarationPage: ReadDeclarationPage;

  constructor(page: Page) {
    this.contactYourGPSurgeryAboutYourNHSHealthCheckPage =
      new ContactYourGPSurgeryAboutYourNHSHealthCheckPage(page);
    this.haveYouCompletedNhsHealthCheckPage =
      new HaveYouCompletedNhsHealthCheckPage(page);
    this.preExistingHealthConditionsNotEligiblePage =
      new PreExistingHealthConditionsNotEligiblePage(page);
    this.preExistingHealthConditionsPage = new PreExistingHealthConditionsPage(
      page
    );
    this.previousHealthCheckCompletedPage =
      new PreviousHealthCheckCompletedPage(page);
    this.whoShouldNotUseThisOnlineServicePage =
      new WhoShouldNotUseThisOnlineServicePage(page);
    this.receivedInvitationQueryPage = new ReceivedInvitationQueryPage(page);
    this.readDeclarationPage = new ReadDeclarationPage(page);
  }
}
