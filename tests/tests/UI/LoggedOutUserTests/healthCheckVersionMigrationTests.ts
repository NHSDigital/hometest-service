import { test, expect } from '../../../fixtures/commonFixture';
import NhsLoginHelper from '../../../page-objects/NhsLoginHelper';
import { HealthCheckBuilder } from '../../../testData/healthCheck/healthCheckBuilder';
import { dataModelVersion } from '../../../testData/partialBloodResultsE2ETestData';
import type {
  BaseTestUser,
  NHSLoginMockedUser,
  NHSLoginUser
} from '../../../lib/users/BaseUser';
import { SpecialUserKey } from '../../../lib/users/SpecialUserKey';

const oldVersion = '1.0.0';
const nhsLoginHelper = new NhsLoginHelper();

let eligibleUser: BaseTestUser;

export function healthCheckVersionMigrationTests(): void {
  test.beforeAll(({ testedUser, userManager, config }) => {
    if (!config.integratedEnvironment) {
      eligibleUser = testedUser;
    } else {
      eligibleUser = userManager.getSpecialUser(SpecialUserKey.ELIGIBLE_USER_2);
    }
  });

  test.describe('Health Check Version Migration page for user with Health Check version out of date and up to date T&C', () => {
    test.beforeEach(
      async ({
        page,
        context,
        nhsLoginPages,
        dbPatientService,
        dynamoDBServiceUtils,
        config
      }) => {
        await context.clearCookies();
        await dbPatientService.updatePatientAcceptedTermsVersion(
          eligibleUser.nhsNumber
        );

        await dynamoDBServiceUtils.cleanHealthCheckTableAndAddHealthCheckItem(
          eligibleUser,
          new HealthCheckBuilder(eligibleUser)
            .withDataModelVersion(dataModelVersion.V1_0_0)
            .build()
        );

        if (!config.integratedEnvironment) {
          await nhsLoginPages.nhsFirstPage.goToTheQuestionnaireAppURLWithLoginMock(
            (eligibleUser as NHSLoginMockedUser).code
          );
        } else {
          await nhsLoginPages.nhsFirstPage.goToTheQuestionnaireAppUrlAndClickContinue();
          await nhsLoginPages.nhsAppRedirectorPage.waitUntilLoadedAndClickContinue();
          await nhsLoginHelper.fillNhsLoginFormsAndWaitForNextPage(
            eligibleUser as NHSLoginUser,
            page
          );
        }
      }
    );

    test(
      'Verify that a user gets redirected to the Task List Page',
      {
        tag: ['@ui', '@regression', '@happyPath', '@backwardCompatibility']
      },
      async ({
        healthCheckVersionMigrationPage,
        eligibilityPages,
        dbHealthCheckService
      }) => {
        await healthCheckVersionMigrationPage.waitUntilLoaded();
        expect(await healthCheckVersionMigrationPage.getHeaderText()).toEqual(
          'Your NHS Health Check online is incomplete'
        );

        await test.step('Check that accepting the change causes the eligibility journey to render', async () => {
          await healthCheckVersionMigrationPage.checkAcceptBoxAndClickContinueButton();
          await eligibilityPages.receivedInvitationQueryPage.pageHeader.waitFor();
          expect(
            eligibilityPages.receivedInvitationQueryPage.pageHeader.isVisible()
          ).toBeTruthy();
        });

        await test.step('Check that the health check version is updated', async () => {
          const healthCheck =
            await dbHealthCheckService.getHealthCheckItemsByNhsNumber(
              eligibleUser.nhsNumber
            );
          expect(healthCheck.length === 1).toBeTruthy();
          expect(healthCheck[0].dataModelVersion).toEqual(
            dataModelVersion.latest
          );
          expect(healthCheck[0].dataModelVersionHistory).toEqual(
            expect.arrayContaining([
              {
                dataModelVersion: oldVersion,
                migrationDate: expect.any(String)
              },
              {
                dataModelVersion: dataModelVersion.latest,
                migrationDate: expect.any(String)
              }
            ])
          );
        });
      }
    );
  });

  test.describe('Health Check Version Migration page for user with Health Check version out of date and out of date T&C', () => {
    test.beforeEach(
      async ({
        page,
        context,
        nhsLoginPages,
        dbAuditEvent,
        dynamoDBServiceUtils,
        dbPatientService,
        config
      }) => {
        await context.clearCookies();
        await dbAuditEvent.deleteItemByNhsNumber(eligibleUser.nhsNumber);

        await dynamoDBServiceUtils.cleanHealthCheckTableAndAddHealthCheckItem(
          eligibleUser,
          new HealthCheckBuilder(eligibleUser)
            .withDataModelVersion(dataModelVersion.V1_0_0)
            .build()
        );

        await dbPatientService.updatePatientAcceptedTermsVersion(
          eligibleUser.nhsNumber,
          '0.1'
        );

        if (!config.integratedEnvironment) {
          await nhsLoginPages.nhsFirstPage.goToTheQuestionnaireAppURLWithLoginMock(
            (eligibleUser as NHSLoginMockedUser).code
          );
        } else {
          await nhsLoginPages.nhsFirstPage.goToTheQuestionnaireAppUrlAndClickContinue();
          await nhsLoginPages.nhsAppRedirectorPage.waitUntilLoadedAndClickContinue();
          await nhsLoginHelper.fillNhsLoginFormsAndWaitForNextPage(
            eligibleUser as NHSLoginUser,
            page
          );
        }
      }
    );

    test.afterEach(async ({ dbPatientService, context }) => {
      await context.close();
      await dbPatientService.updatePatientAcceptedTermsVersion(
        eligibleUser.nhsNumber,
        '1.0'
      );
    });

    test(
      'Verify that a user gets redirected to the T & C Page',
      {
        tag: ['@ui', '@regression', '@happyPath', '@backwardCompatibility']
      },
      async ({
        healthCheckVersionMigrationPage,
        termsAndConditionsPage,
        dbHealthCheckService
      }) => {
        await healthCheckVersionMigrationPage.waitUntilLoaded();
        expect(await healthCheckVersionMigrationPage.getHeaderText()).toEqual(
          'Your NHS Health Check online is incomplete'
        );

        await test.step('Check that accepting the change casues the T & C page to load and the health check version updated', async () => {
          await healthCheckVersionMigrationPage.checkAcceptBoxAndClickContinueButton();
          await termsAndConditionsPage.waitUntilLoaded();
          expect(
            termsAndConditionsPage.iHaveReadAndAcceptTheTermsAndConditionBox.isVisible()
          ).toBeTruthy();

          const healthCheck =
            await dbHealthCheckService.getHealthCheckItemsByNhsNumber(
              eligibleUser.nhsNumber
            );
          expect(healthCheck.length === 1).toBeTruthy();
          expect(healthCheck[0].dataModelVersion).toEqual(
            dataModelVersion.latest
          );
          expect(healthCheck[0].dataModelVersionHistory).toEqual(
            expect.arrayContaining([
              {
                dataModelVersion: oldVersion,
                migrationDate: expect.any(String)
              },
              {
                dataModelVersion: dataModelVersion.latest,
                migrationDate: expect.any(String)
              }
            ])
          );
        });
      }
    );
  });
}
