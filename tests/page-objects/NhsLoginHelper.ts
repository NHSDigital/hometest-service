import { type Page } from '@playwright/test';
import { CodeSecurityPage } from './NHSLogin/CodeSecurityPage';
import { NHSEmailAndPasswordPage } from './NHSLogin/NHSEmailAndPasswordPage';
import { HealthCheckVersionMigrationPage } from './HealthCheckVersionMigrationPage/HealthCheckVersionMigrationPage';
import { ConsentConfirmation } from './NHSLogin/NHSConsentConfirmation';
import { NHSAppTermsAndConditionsPage } from './NHSLogin/NHSAppTermsAndConditionsPage';
import type { HTCPage } from './HTCPage';
import { CompleteHealthCheckFirstPage } from './CompleteHealthCheckFirstPage';
import { NhsLoginConsent } from './NHSLogin/NhsLoginConsent';
import { TaskListPage } from './TaskListPage';
import { NotEligiblePage } from './NotEligiblePage';
import { OdsNhsNumberNotEligiblePage } from './OdsNhsNumberNotEligiblePage';
import type { NHSLoginUser } from '../lib/users/BaseUser';
import { AuthType, ConfigFactory } from '../env/config';
import { CredentialsHelper } from '../lib/CredentialsHelper';
import { AosUserManager } from '../lib/users/AosUserManager';
import { SandpitUserManager } from '../lib/users/SandpitUserManager';
import { NHSFirstPage } from './NHSLogin/NHSFirstPage';
import { NHSAppRedirectorPage } from './NHSLogin/NHSAppRedirectorPage';
import { TermsAndConditionsPage } from './TermsAndConditionsPage/TermsAndConditionsPage';
import { ReceivedInvitationQueryPage } from './EligibilityPages/ReceivedInvitationQueryPage';

export default class NhsLoginHelper {
  // List of possible pages after login and actions to perform on them (if any)
  // This allows for handling different flows that may unexpectedly appear after login
  // such as NHS App Terms and Conditions acceptance which sometimes appears
  private possiblePostLoginPagesAndActions: Array<{
    page: new (
      page: Page
    ) =>
      | HTCPage
      | ConsentConfirmation
      | NHSAppTermsAndConditionsPage
      | NhsLoginConsent;
    action: null | ((page: Page) => Promise<void>);
  }> = [
    { page: HealthCheckVersionMigrationPage, action: null },
    { page: ConsentConfirmation, action: null },
    { page: CompleteHealthCheckFirstPage, action: null },
    { page: NhsLoginConsent, action: null },
    { page: TaskListPage, action: null },
    { page: ReceivedInvitationQueryPage, action: null },
    { page: NotEligiblePage, action: null },
    { page: OdsNhsNumberNotEligiblePage, action: null },
    {
      page: NHSAppTermsAndConditionsPage,
      action: async (page: Page) => {
        await new NHSAppTermsAndConditionsPage(page).fillFormAndClickContinue();
      }
    }
  ];

  private async detectFirstPostLoginPage(page: Page): Promise<void> {
    const detectors = this.possiblePostLoginPagesAndActions.map(
      async ({ page: PageObjectCtor, action }) => {
        const instance = new PageObjectCtor(page);
        return instance.waitUntilLoaded().then(async () => {
          if (action) {
            await action(page);
          }
          return PageObjectCtor.name;
        });
      }
    );

    const HARD_CAP_MS = 60000;

    await Promise.race([
      Promise.any(detectors).catch(() => {
        // All detectors failed (no known page appeared within their individual timeouts)
        console.log(
          'ERROR: No known post-login page detected within the timeout period.'
        );
        throw new Error('No known post-login page detected');
      }),
      new Promise<void>((resolve) => setTimeout(resolve, HARD_CAP_MS))
    ]);
  }

  public async fillNhsLoginFormsAndWaitForNextPage(
    nhsLoginUser: NHSLoginUser,
    page: Page
  ): Promise<void> {
    const loginPage = new NHSEmailAndPasswordPage(page);
    const codeSecurityPage = new CodeSecurityPage(page);

    await loginPage.fillAuthFormWithCredentialsAndClickContinue(nhsLoginUser);
    await codeSecurityPage.fillAuthOneTimePasswordAndClickContinue(
      nhsLoginUser.otp
    );
    // Parallel detection of whichever post-login page appears first.
    await this.detectFirstPostLoginPage(page);
  }

  public async loginAndNavigateToHealthCheckPage(
    nhsLoginUser: NHSLoginUser,
    page: Page
  ): Promise<void> {
    const firstPage = new NHSFirstPage(page);
    const nhsRedirectionPage = new NHSAppRedirectorPage(page);

    await firstPage.goToTheQuestionnaireAppUrlAndClickContinue();
    await nhsRedirectionPage.waitUntilLoadedAndClickContinue();
    await this.fillNhsLoginFormsAndWaitForNextPage(nhsLoginUser, page);
    await this.handlePostLoginFlowForGlobalSetup(page);
  }

  private async handlePostLoginFlowForGlobalSetup(page: Page): Promise<void> {
    const startPage = new CompleteHealthCheckFirstPage(page);
    const healthCheckVersionPage = new HealthCheckVersionMigrationPage(page);
    const termsAndConditionPage = new TermsAndConditionsPage(page);
    const taskListPage = new TaskListPage(page);

    if (await startPage.startNowBtn.isVisible()) {
      await startPage.clickStartNowBtn();
      await termsAndConditionPage.checkAcceptTermsBoxAndClickAcceptAndContinueButton();
      await taskListPage.waitUntilLoaded();
    } else if (
      await healthCheckVersionPage.iHaveReadAndAcceptTheVersionChange.isVisible()
    ) {
      await healthCheckVersionPage.checkAcceptBoxAndClickContinueButton();
      await termsAndConditionPage.checkAcceptTermsBoxAndClickAcceptAndContinueButton();
      await taskListPage.waitUntilLoaded();
    } else if (
      await termsAndConditionPage.iHaveReadAndAcceptTheTermsAndConditionBox.isVisible()
    ) {
      await termsAndConditionPage.checkAcceptTermsBoxAndClickAcceptAndContinueButton();
      await taskListPage.waitUntilLoaded();
    }
  }

  public async recreateAuthorizationCookieJson(
    page: Page,
    workerParallelIndex: number
  ): Promise<void> {
    const config = ConfigFactory.getConfig();
    const eligibleUserList =
      config.authType === AuthType.SANDPIT
        ? new SandpitUserManager().getWorkerUsers()
        : new AosUserManager().getWorkerUsers();

    const user: NHSLoginUser = eligibleUserList[workerParallelIndex];
    await new CredentialsHelper().addCredentialsToEnvVariable();
    await page.context().clearCookies();
    await this.loginNhsUser(page, user);
    await page.context().storageState({
      path: `./WorkerUserSession${eligibleUserList.indexOf(user)}.json`
    });
  }

  public async loginNhsUser(page: Page, user: NHSLoginUser): Promise<Page> {
    console.log(`Logging in the user : ${user.email}`);
    await this.loginAndNavigateToHealthCheckPage(user, page);
    return page;
  }
}
