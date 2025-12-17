import { test, expect } from '../../../fixtures/commonFixture';
import { type Config, ConfigFactory } from '../../../env/config';
import DbHealthCheckService from '../../../lib/aws/dynamoDB/DbHealthCheckService';
import { TestScenariosPage } from '../../../page-objects/TestScenariosPage';
import DbSessionService, {
  type SessionItem
} from '../../../lib/aws/dynamoDB/DbSessionService';
import DbPatientService from '../../../lib/aws/dynamoDB/DbPatientService';
import NhsLoginHelper from '../../../page-objects/NhsLoginHelper';
import { AuditEventType } from '@dnhc-health-checks/shared/model/enum/audit-event-type';
import type DbAuditEvent from '../../../lib/aws/dynamoDB/DbAuditEventService';
import { SpecialUserKey } from '../../../lib/users/SpecialUserKey';
import type {
  BaseTestUser,
  NHSLoginMockedUser,
  NHSLoginUser
} from '../../../lib/users/BaseUser';

const config: Config = ConfigFactory.getConfig();
const dbPatientService = new DbPatientService(config.name);
const dbHealthCheckService = new DbHealthCheckService(config.name);
const dbSessionService = new DbSessionService(config.name);
const nhsLoginHelper = new NhsLoginHelper();
let testedUser: BaseTestUser;
let testStartDate: string;

async function ensureSessionItemDeleted(
  testedUser: BaseTestUser,
  dbSessionService: DbSessionService,
  sessionItem: SessionItem
): Promise<void> {
  const sessionItems = await dbSessionService.getSessionsByNhsNumber(
    testedUser.nhsNumber
  );
  expect(
    sessionItems.find((item) => item.sessionId === sessionItem.sessionId)
  ).toBeUndefined();
}

async function checkSessionLoggedOutAuditEvent(
  testedUser: BaseTestUser,
  dbAuditEvent: DbAuditEvent,
  testStartDate: string
): Promise<void> {
  const lastMessage = await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
    testedUser.nhsNumber,
    AuditEventType.SessionLoggedOut,
    testStartDate
  );
  expect(lastMessage).toBeTruthy();
}

export function logoutPageTestForIntegratedEnv(): void {
  test.beforeEach(async ({ page, context, nhsLoginPages, userManager }) => {
    await context.clearCookies();
    testStartDate = new Date().toISOString();
    testedUser = userManager.getSpecialUser(
      SpecialUserKey.LOGOUT_DEDICATED_USER
    );

    await dbHealthCheckService.deleteItemByNhsNumber(testedUser.nhsNumber);
    await dbPatientService.deletePatientItemByNhsNumber(testedUser.nhsNumber);

    await nhsLoginPages.nhsFirstPage.goToTheQuestionnaireAppUrlAndClickContinue();
    await nhsLoginPages.nhsAppRedirectorPage.waitUntilLoadedAndClickContinue();
    await nhsLoginHelper.fillNhsLoginFormsAndWaitForNextPage(
      testedUser as NHSLoginUser,
      page
    );
  });

  test(
    'Verify the user is redirected to logged out page and is able to proceed journey - NHS Sandpit',
    {
      tag: ['@ui', '@regression', '@login']
    },
    async ({
      completeHealthCheckFirstPage,
      logoutPage,
      nhsLoginPages,
      dbAuditEvent
    }) => {
      let sessionItem: SessionItem;

      await test.step('Go to TaskList page and click log out button, verify redirection to the logged out page', async () => {
        await completeHealthCheckFirstPage.waitUntilLoaded();
        sessionItem = await dbSessionService.getLatestSessionItemsByNhsNumber(
          testedUser.nhsNumber
        );
        await completeHealthCheckFirstPage.clickLogoutButton();
        await logoutPage.waitUntilLoaded();
      });

      await test.step('From the logout page, click continue button, verify redirection to the enter-email page', async () => {
        await logoutPage.clickContinueButton();
        await nhsLoginPages.nhsEmailPage.waitUntilLoaded();
      });

      await test.step('Ensure the session item is deleted from the session db', async () => {
        await ensureSessionItemDeleted(
          testedUser,
          dbSessionService,
          sessionItem
        );
      });

      await test.step('Check if SessionLoggedOut event was created in DB after logging out', async () => {
        await checkSessionLoggedOutAuditEvent(
          testedUser,
          dbAuditEvent,
          testStartDate
        );
      });
    }
  );
}

export function logoutPageTestForMock(): void {
  test.beforeEach(async ({ context, nhsLoginPages, userManager }) => {
    await context.clearCookies();
    testStartDate = new Date().toISOString();
    testedUser = userManager.getSpecialUser(
      SpecialUserKey.LOGOUT_DEDICATED_USER
    );

    await dbHealthCheckService.deleteItemByNhsNumber(testedUser.nhsNumber);
    await dbPatientService.deletePatientItemByNhsNumber(testedUser.nhsNumber);

    await nhsLoginPages.nhsFirstPage.goToTheQuestionnaireAppURLWithLoginMock(
      (testedUser as NHSLoginMockedUser).code
    );
  });

  test(
    'Verify the user is redirected to logged out page and is able to proceed journey - Mock',
    {
      tag: ['@ui', '@regression', '@login']
    },
    async ({
      page,
      completeHealthCheckFirstPage,
      logoutPage,
      dbAuditEvent
    }) => {
      let sessionItem: SessionItem;
      await test.step('Go to Complete your health check page and click log out button, verify redirection to the logged out page', async () => {
        await completeHealthCheckFirstPage.waitUntilLoaded();
        sessionItem = await dbSessionService.getLatestSessionItemsByNhsNumber(
          testedUser.nhsNumber
        );
        await completeHealthCheckFirstPage.clickLogoutButton();
        await logoutPage.waitUntilLoaded();
      });
      await test.step('From the logout page, click continue button, verify redirection - NHS Mock', async () => {
        await logoutPage.clickContinueButton();
        await new TestScenariosPage(page).waitUntilLoaded();
      });

      await test.step('Ensure the session item is deleted from the session db', async () => {
        await ensureSessionItemDeleted(
          testedUser,
          dbSessionService,
          sessionItem
        );
      });

      await test.step('Check if SessionLoggedOut event was created in DB after logging out', async () => {
        await checkSessionLoggedOutAuditEvent(
          testedUser,
          dbAuditEvent,
          testStartDate
        );
      });
    }
  );
}
