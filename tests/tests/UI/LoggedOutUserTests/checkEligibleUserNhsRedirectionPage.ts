import { test, expect } from '../../../fixtures/commonFixture';
import { type Config, ConfigFactory } from '../../../env/config';
import { CredentialsHelper } from '../../../lib/CredentialsHelper';
import NhsLoginHelper from '../../../page-objects/NhsLoginHelper';
import {
  HealthCheckFactory,
  HealthCheckType
} from '../../../testData/healthCheck/healthCheckFactory';
import type { NHSLoginUser } from '../../../lib/users/BaseUser';
import { SpecialUserKey } from '../../../lib/users/SpecialUserKey';

const config: Config = ConfigFactory.getConfig();
const nhsLoginHelper = new NhsLoginHelper();
let nhsLoginTestUser: NHSLoginUser;

export default function checkEligibleUserNhsRedirectionPage(): void {
  test.describe('Eligible user redirection page tests with NHS Login', () => {
    test.skip(!config.integratedEnvironment);
    test.beforeEach(
      async ({ dbHealthCheckService, dbAuditEvent, userManager }) => {
        nhsLoginTestUser = userManager.getSpecialUser(
          SpecialUserKey.ELIGIBLE_USER
        ) as NHSLoginUser;
        await dbHealthCheckService.deleteItemByNhsNumber(
          nhsLoginTestUser.nhsNumber
        );

        await dbAuditEvent.deleteItemByNhsNumber(nhsLoginTestUser.nhsNumber);
        await new CredentialsHelper().addCredentialsToEnvVariable();
      }
    );

    test.afterEach(async ({ dbHealthCheckService, dbAuditEvent }) => {
      await dbHealthCheckService.deleteItemByNhsNumber(
        nhsLoginTestUser.nhsNumber
      );
      await dbAuditEvent.deleteItemByNhsNumber(nhsLoginTestUser.nhsNumber);
    });

    test(
      'Verify if eligible user without an account in DB will be redirected to Complete Health Check Page',
      {
        tag: ['@ui', '@checkEligibility', '@regression', '@happyPath']
      },
      async ({
        context,
        page,
        nhsLoginPages,
        completeHealthCheckFirstPage,
        termsAndConditionsPage,
        dbAuditEvent
      }) => {
        await context.clearCookies();
        const testStartDate = new Date().toISOString();

        await test.step('Login as eligible user', async () => {
          await nhsLoginPages.nhsFirstPage.goToTheQuestionnaireAppUrlAndClickContinue();
          await nhsLoginPages.nhsAppRedirectorPage.waitUntilLoadedAndClickContinue();
          await nhsLoginHelper.fillNhsLoginFormsAndWaitForNextPage(
            nhsLoginTestUser,
            page
          );

          await completeHealthCheckFirstPage.waitUntilLoaded();
          expect(await completeHealthCheckFirstPage.getHeaderText()).toContain(
            'Get your NHS Health Check online'
          );
        });

        await test.step('Click start button, accept terms and conditions, and check if HealthCheckCreated event was created', async () => {
          await completeHealthCheckFirstPage.clickStartNowBtn();
          await termsAndConditionsPage.checkAcceptTermsBoxAndClickAcceptAndContinueButton();
          const lastMessage =
            await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
              nhsLoginTestUser.nhsNumber,
              'HealthCheckCreated',
              testStartDate
            );
          expect(lastMessage).toBeTruthy();
        });
      }
    );
  });

  test.describe('Eligible user redirection page tests with NHS Login', () => {
    test.skip(!config.integratedEnvironment);
    test.beforeAll(async ({ dynamoDBServiceUtils, dbAuditEvent }) => {
      await dynamoDBServiceUtils.cleanHealthCheckTableAndAddHealthCheckItem(
        nhsLoginTestUser,
        HealthCheckFactory.createHealthCheck(
          nhsLoginTestUser,
          HealthCheckType.INITIAL
        )
      );
      await dbAuditEvent.deleteItemByNhsNumber(nhsLoginTestUser.nhsNumber);
      await new CredentialsHelper().addCredentialsToEnvVariable();
    });

    test.afterAll(async ({ dbHealthCheckService, dbAuditEvent }) => {
      await dbHealthCheckService.deleteItemByNhsNumber(
        nhsLoginTestUser.nhsNumber
      );
      await dbAuditEvent.deleteItemByNhsNumber(nhsLoginTestUser.nhsNumber);
    });

    test(
      'Verify if eligible user with a empty health check in the DB will be redirected to Received Invite page',
      {
        tag: ['@ui', '@checkEligibility', '@regression', '@happyPath']
      },
      async ({
        context,
        page,
        nhsLoginPages,
        eligibilityPages,
        dbAuditEvent
      }) => {
        await context.clearCookies();
        const testStartDate = new Date().toISOString();

        await test.step('Login as eligible user', async () => {
          await nhsLoginPages.nhsFirstPage.goToTheQuestionnaireAppUrlAndClickContinue();
          await nhsLoginPages.nhsAppRedirectorPage.waitUntilLoadedAndClickContinue();
          if (
            'otp' in nhsLoginTestUser &&
            'password' in nhsLoginTestUser &&
            'email' in nhsLoginTestUser
          ) {
            await nhsLoginHelper.fillNhsLoginFormsAndWaitForNextPage(
              nhsLoginTestUser,
              page
            );
          }

          await eligibilityPages.receivedInvitationQueryPage.waitUntilLoaded();
          expect(
            await eligibilityPages.receivedInvitationQueryPage.pageHeader.textContent()
          ).toContain(
            eligibilityPages.receivedInvitationQueryPage.getExpectedTitleHeading()
          );
        });

        await test.step('Check if PatientLoggedIn event was created', async () => {
          const lastMessage =
            await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
              nhsLoginTestUser.nhsNumber,
              'PatientLoggedIn',
              testStartDate
            );
          expect(lastMessage).toBeTruthy();
          expect(lastMessage?.details?.urlSource).toBeUndefined();
        });

        await test.step('Check if PatientLoggedInToNhsLogin event was created', async () => {
          const lastMessage =
            await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
              nhsLoginTestUser.nhsNumber,
              'PatientLoggedInToNhsLogin',
              testStartDate
            );
          expect(lastMessage).toBeTruthy();
          expect(lastMessage?.details?.urlSource).toBeUndefined();
        });
      }
    );
  });

  test.describe('Eligible user redirection page tests with NHS Login', () => {
    test.skip(!config.integratedEnvironment);

    test(
      'Verify if user under age threshold can not display Task List page',
      {
        tag: ['@ui', '@checkEligibility', '@regression', '@happyPath']
      },
      async ({
        context,
        page,
        nhsLoginPages,
        notEligiblePage,
        dbAuditEvent,
        userManager
      }) => {
        await context.clearCookies();
        const testStartDate = new Date().toISOString();

        const notEligibleUserUnderage = userManager.getSpecialUser(
          SpecialUserKey.INELIGIBLE_USER_UNDERAGE_BOUNDARY
        ) as NHSLoginUser;

        await test.step('Login as user under age threshold', async () => {
          await nhsLoginPages.nhsFirstPage.goToTheQuestionnaireAppUrlAndClickContinue();
          await nhsLoginPages.nhsAppRedirectorPage.waitUntilLoadedAndClickContinue();

          await nhsLoginHelper.fillNhsLoginFormsAndWaitForNextPage(
            notEligibleUserUnderage as NHSLoginUser,
            page
          );
        });

        await test.step('Verify the user is not allowed to access Health Check and audit event is saved', async () => {
          await notEligiblePage.waitUntilLoaded();

          const lastMessage =
            await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
              notEligibleUserUnderage.nhsNumber,
              'PatientIneligibleUnderAgeThreshold',
              testStartDate
            );
          expect(lastMessage).toBeTruthy();
        });
      }
    );

    test(
      'Verify if user above age threshold can not display Task List page',
      {
        tag: ['@ui', '@checkEligibility', '@regression', '@happyPath']
      },
      async ({
        context,
        page,
        nhsLoginPages,
        notEligiblePage,
        dbAuditEvent,
        userManager
      }) => {
        await context.clearCookies();
        const testStartDate = new Date().toISOString();

        const notEligibleUserOverage = userManager.getSpecialUser(
          SpecialUserKey.INELIGIBLE_USER_OVERAGE_BOUNDARY
        ) as NHSLoginUser;

        await test.step('Login as user above age threshold', async () => {
          await nhsLoginPages.nhsFirstPage.goToTheQuestionnaireAppUrlAndClickContinue();
          await nhsLoginPages.nhsAppRedirectorPage.waitUntilLoadedAndClickContinue();

          await nhsLoginHelper.fillNhsLoginFormsAndWaitForNextPage(
            notEligibleUserOverage as NHSLoginUser,
            page
          );
        });

        await test.step('Verify the user is not allowed to access Health Check and audit event is saved', async () => {
          await notEligiblePage.waitUntilLoaded();

          const lastMessage =
            await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
              notEligibleUserOverage.nhsNumber,
              'PatientIneligibleAboveAgeThreshold',
              testStartDate
            );
          expect(lastMessage).toBeTruthy();
        });
      }
    );
  });
}
