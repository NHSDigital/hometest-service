import { test, expect } from '../../../fixtures/commonFixture';
import { type Config, ConfigFactory } from '../../../env/config';
import type DbHealthCheckService from '../../../lib/aws/dynamoDB/DbHealthCheckService';
import type DbAuditEventService from '../../../lib/aws/dynamoDB/DbAuditEventService';
import {
  HealthCheckFactory,
  HealthCheckType
} from '../../../testData/healthCheck/healthCheckFactory';
import type { NHSLoginMockedUser } from '../../../lib/users/BaseUser';
import { SpecialUserKey } from '../../../lib/users/SpecialUserKey';

const config: Config = ConfigFactory.getConfig();

let mockedEligibleUserUpperBoundary: NHSLoginMockedUser;
let mockedNotEligibleUserOverageBoundary: NHSLoginMockedUser;
let mockedNotEligibleUserUnderageBoundary: NHSLoginMockedUser;

async function clearDbDataForMockUsers(
  dbHealthCheckService: DbHealthCheckService,
  dbAuditEventService: DbAuditEventService,
  mockedUser: NHSLoginMockedUser
): Promise<void> {
  await dbHealthCheckService.deleteItemByNhsNumber(mockedUser.nhsNumber);
  await dbAuditEventService.deleteItemByNhsNumber(mockedUser.nhsNumber);
}

export default function checkEligibleUserMockRediractionPageTest(): void {
  test.describe('Eligible user redirection page tests with NHS Login Mock', () => {
    test.skip(config.integratedEnvironment);
    test.beforeAll(
      async ({
        testedUser,
        dbHealthCheckService,
        dbAuditEvent,
        dbPatientService
      }) => {
        await clearDbDataForMockUsers(
          dbHealthCheckService,
          dbAuditEvent,
          testedUser as NHSLoginMockedUser
        );

        await dbPatientService.deletePatientItemByNhsNumber(
          testedUser.nhsNumber
        );
      }
    );
    test.afterAll(
      async ({ testedUser, dbHealthCheckService, dbAuditEvent }) => {
        await clearDbDataForMockUsers(
          dbHealthCheckService,
          dbAuditEvent,
          testedUser as NHSLoginMockedUser
        );
      }
    );

    test(
      'Verify if eligible user without an account in DB will be redirected to Complete Health Check Page with mock NHS Login',
      {
        tag: ['@ui', '@checkEligibility', '@regression', '@happyPath']
      },
      async ({
        completeHealthCheckFirstPage,
        nhsLoginPages,
        termsAndConditionsPage,
        testedUser,
        dbAuditEvent,
        dbPatientService
      }) => {
        const testStartDate = new Date().toISOString();
        const eligibleUser: NHSLoginMockedUser =
          testedUser as NHSLoginMockedUser;

        await test.step('Login as eligible user', async () => {
          await nhsLoginPages.nhsFirstPage.goToTheQuestionnaireAppURLWithLoginMock(
            eligibleUser.code
          );
          await completeHealthCheckFirstPage.waitUntilLoaded();
          expect(await completeHealthCheckFirstPage.getHeaderText()).toContain(
            'Get your NHS Health Check online'
          );
        });

        await test.step('Verify that patient was initialized in DynamoDB', async () => {
          const patient = await dbPatientService.getPatientItemByNhsNumber(
            eligibleUser.nhsNumber
          );
          expect(patient !== undefined, 'Patient was not found').toBeTruthy();
          expect(
            patient?.acceptedTermsVersion,
            'Patient terms and conditions are not empty'
          ).toBeUndefined();
        });

        await test.step('Click start button, accept terms and conditions, and check if HealthCheckCreated event was created', async () => {
          await completeHealthCheckFirstPage.clickStartNowBtn();
          await termsAndConditionsPage.checkAcceptTermsBoxAndClickAcceptAndContinueButton();
          const lastMessage =
            await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
              eligibleUser.nhsNumber,
              'HealthCheckCreated',
              testStartDate
            );
          expect(lastMessage).toBeTruthy();
        });
      }
    );
  });

  test.describe('Eligible user redirection page tests with NHS Login Mock', () => {
    test.skip(config.integratedEnvironment);
    test.beforeAll(async ({ testedUser, dynamoDBServiceUtils }) => {
      await dynamoDBServiceUtils.cleanHealthCheckTableAndAddHealthCheckItem(
        testedUser,
        HealthCheckFactory.createHealthCheck(
          testedUser,
          HealthCheckType.INITIAL
        )
      );
    });

    test.afterAll(
      async ({ testedUser, dbHealthCheckService, dbAuditEvent }) => {
        await clearDbDataForMockUsers(
          dbHealthCheckService,
          dbAuditEvent,
          testedUser as NHSLoginMockedUser
        );
      }
    );

    test(
      'Verify if eligible user with a empty health check in the DB will be redirected to Received Invite page with mock NHS Login',
      {
        tag: ['@ui', '@checkEligibility', '@regression', '@happyPath']
      },
      async ({ nhsLoginPages, eligibilityPages, testedUser, dbAuditEvent }) => {
        const testStartDate = new Date().toISOString();
        const eligibleUser: NHSLoginMockedUser =
          testedUser as NHSLoginMockedUser;

        await test.step('Login as eligible user', async () => {
          await nhsLoginPages.nhsFirstPage.goToTheQuestionnaireAppURLWithLoginMock(
            eligibleUser.code
          );
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
              eligibleUser.nhsNumber,
              'PatientLoggedIn',
              testStartDate
            );
          expect(lastMessage).toBeTruthy();
          expect(lastMessage?.details?.urlSource).toBeUndefined();
        });

        await test.step('Check if PatientLoggedInToNhsLogin event was created', async () => {
          const lastMessage =
            await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
              eligibleUser.nhsNumber,
              'PatientLoggedInToNhsLogin',
              testStartDate
            );
          expect(lastMessage).toBeTruthy();
          expect(lastMessage?.details?.urlSource).toBeUndefined();
        });
      }
    );
  });

  test.describe('Eligible user redirection page tests with NHS Login Mock', () => {
    test.skip(config.integratedEnvironment);
    test.beforeAll(async ({ testedUser, dynamoDBServiceUtils }) => {
      await dynamoDBServiceUtils.cleanHealthCheckTableAndAddHealthCheckItem(
        testedUser,
        HealthCheckFactory.createHealthCheck(
          testedUser,
          HealthCheckType.QUESTIONNAIRE_FILLED
        )
      );
    });

    test.afterAll(
      async ({ testedUser, dbHealthCheckService, dbAuditEvent }) => {
        await clearDbDataForMockUsers(
          dbHealthCheckService,
          dbAuditEvent,
          testedUser as NHSLoginMockedUser
        );
      }
    );

    test(
      'Verify if eligible user with a filled health check in the DB will be redirected to TaskList page with mock NHS Login',
      {
        tag: ['@ui', '@checkEligibility', '@regression', '@happyPath']
      },
      async ({ nhsLoginPages, taskListPage, testedUser }) => {
        const eligibleUser: NHSLoginMockedUser =
          testedUser as NHSLoginMockedUser;

        await test.step('Login as eligible user', async () => {
          await nhsLoginPages.nhsFirstPage.goToTheQuestionnaireAppURLWithLoginMock(
            eligibleUser.code
          );
          await taskListPage.waitUntilLoaded();
          expect(await taskListPage.getHeaderText()).toEqual(
            'NHS Health Check'
          );
        });
      }
    );
  });

  test.describe('Eligible user redirection page tests with NHS Login Mock', () => {
    test.skip(config.integratedEnvironment);
    test.beforeAll(
      async ({
        testedUser,
        dbHealthCheckService,
        dbAuditEvent,
        userManager
      }) => {
        mockedEligibleUserUpperBoundary = userManager.getSpecialUser(
          SpecialUserKey.LOGOUT_DEDICATED_USER
        ) as NHSLoginMockedUser;

        mockedNotEligibleUserOverageBoundary = userManager.getSpecialUser(
          SpecialUserKey.INELIGIBLE_USER_OVERAGE_BOUNDARY
        ) as NHSLoginMockedUser;

        mockedNotEligibleUserUnderageBoundary = userManager.getSpecialUser(
          SpecialUserKey.INELIGIBLE_USER_UNDERAGE_BOUNDARY
        ) as NHSLoginMockedUser;

        await clearDbDataForMockUsers(
          dbHealthCheckService,
          dbAuditEvent,
          testedUser as NHSLoginMockedUser
        );
        await clearDbDataForMockUsers(
          dbHealthCheckService,
          dbAuditEvent,
          mockedEligibleUserUpperBoundary
        );
        await clearDbDataForMockUsers(
          dbHealthCheckService,
          dbAuditEvent,
          mockedNotEligibleUserOverageBoundary
        );
      }
    );

    test.afterAll(
      async ({ testedUser, dbHealthCheckService, dbAuditEvent }) => {
        await clearDbDataForMockUsers(
          dbHealthCheckService,
          dbAuditEvent,
          testedUser as NHSLoginMockedUser
        );
        await clearDbDataForMockUsers(
          dbHealthCheckService,
          dbAuditEvent,
          mockedEligibleUserUpperBoundary
        );
        await clearDbDataForMockUsers(
          dbHealthCheckService,
          dbAuditEvent,
          mockedNotEligibleUserOverageBoundary
        );
      }
    );

    test(
      'Verify if eligible user at age lower boundary can display Task List page with mock NHS Login - boundary age: 40y',
      {
        tag: ['@ui', '@checkEligibility', '@regression', '@happyPath']
      },
      async ({
        context,
        nhsLoginPages,
        completeHealthCheckFirstPage,
        termsAndConditionsPage,
        taskListPage,
        testedUser
      }) => {
        await test.step('Login as eligible user, age: 40y', async () => {
          await context.clearCookies();
          await nhsLoginPages.nhsFirstPage.goToTheQuestionnaireAppURLWithLoginMock(
            testedUser.code as unknown as string
          );
          await completeHealthCheckFirstPage.waitUntilLoaded();
        });

        await test.step('Click start button and check if Task List is displayed', async () => {
          await completeHealthCheckFirstPage.clickStartNowBtn();
          await termsAndConditionsPage.checkAcceptTermsBoxAndClickAcceptAndContinueButton();
          await taskListPage.waitUntilLoaded();
        });
      }
    );

    test(
      'Verify if eligible user at age upper boundary can display Task List page with mock NHS Login - boundary age: 75y-1d',
      {
        tag: ['@ui', '@checkEligibility', '@regression', '@happyPath']
      },
      async ({
        nhsLoginPages,
        completeHealthCheckFirstPage,
        termsAndConditionsPage,
        taskListPage
      }) => {
        await test.step('Login as eligible user, age: 75y-1d', async () => {
          await nhsLoginPages.nhsFirstPage.goToTheQuestionnaireAppURLWithLoginMock(
            mockedEligibleUserUpperBoundary.code
          );
          await completeHealthCheckFirstPage.waitUntilLoaded();
        });

        await test.step('Click start button and check if Task List is displayed', async () => {
          await completeHealthCheckFirstPage.clickStartNowBtn();
          await termsAndConditionsPage.checkAcceptTermsBoxAndClickAcceptAndContinueButton();
          await taskListPage.waitUntilLoaded();
        });
      }
    );

    test(
      'Verify if user under age threshold can not display Task List page with mock NHS Login - boundary age: 40y-1d',
      {
        tag: ['@ui', '@checkEligibility', '@regression', '@happyPath']
      },
      async ({ nhsLoginPages, notEligiblePage, dbAuditEvent }) => {
        const testStartDate = new Date().toISOString();

        await test.step('Login as user under age threshold', async () => {
          await nhsLoginPages.nhsFirstPage.goToTheQuestionnaireAppURLWithLoginMock(
            mockedNotEligibleUserUnderageBoundary.code
          );
        });

        await test.step('Verify the user is not allowed to access Health Check and audit event is saved', async () => {
          await notEligiblePage.waitUntilLoaded();

          const lastMessage =
            await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
              mockedNotEligibleUserUnderageBoundary.nhsNumber,
              'PatientIneligibleUnderAgeThreshold',
              testStartDate
            );
          expect(lastMessage).toBeTruthy();
        });
      }
    );

    test(
      'Verify if user above age threshold can not display Task List page with mock NHS Login - boundary age: 75y',
      {
        tag: ['@ui', '@checkEligibility', '@regression', '@happyPath']
      },
      async ({ nhsLoginPages, notEligiblePage, dbAuditEvent }) => {
        const testStartDate = new Date().toISOString();

        await test.step('Login as user above age threshold', async () => {
          await nhsLoginPages.nhsFirstPage.goToTheQuestionnaireAppURLWithLoginMock(
            mockedNotEligibleUserOverageBoundary.code
          );
        });

        await test.step('Verify the user is not allowed to access Health Check and audit event is saved', async () => {
          await notEligiblePage.waitUntilLoaded();

          const lastMessage =
            await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
              mockedNotEligibleUserOverageBoundary.nhsNumber,
              'PatientIneligibleAboveAgeThreshold',
              testStartDate
            );
          expect(lastMessage).toBeTruthy();
        });
      }
    );
  });
}
