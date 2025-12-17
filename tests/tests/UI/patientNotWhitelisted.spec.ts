import { test, expect } from '../../fixtures/commonFixture';
import { AuditEventType } from '@dnhc-health-checks/shared';
import { SpecialUserKey } from '../../lib/users/SpecialUserKey';

test.beforeEach(
  async ({
    dbAuditEvent,
    dbPatientService,
    dbHealthCheckService,
    userManager
  }) => {
    await dbAuditEvent.deleteItemByNhsNumber(
      userManager.getSpecialUser(SpecialUserKey.NOT_WHITELISTED_NHS_NUMBER)
        .nhsNumber
    );
    await dbPatientService.deletePatientItemByNhsNumber(
      userManager.getSpecialUser(SpecialUserKey.NOT_WHITELISTED_NHS_NUMBER)
        .nhsNumber
    );
    await dbHealthCheckService.deleteItemByNhsNumber(
      userManager.getSpecialUser(SpecialUserKey.NOT_WHITELISTED_NHS_NUMBER)
        .nhsNumber
    );
  }
);

test.skip(
  'Toggle now disabled - Verify if Patient with not whitelisted NHS Number is not eligible to login',
  {
    tag: ['@ui', '@regression', '@login']
  },
  async ({
    nhsLoginPages,
    odsNhsNumberNotEligiblePage,
    dbAuditEvent,
    userManager,
    config
  }) => {
    test.skip(config.integratedEnvironment);
    const testStartDate = new Date().toISOString();
    const mockedNotWhitelistedNhsNumber = userManager.getSpecialUser(
      SpecialUserKey.NOT_WHITELISTED_NHS_NUMBER
    );

    await test.step(`Check if patient is redirected to the Sorry, you cannot complete an NHS Health Check online page`, async () => {
      await nhsLoginPages.nhsFirstPage.goToTheQuestionnaireAppURLWithLoginMock(
        mockedNotWhitelistedNhsNumber.code as string
      );
      expect(await odsNhsNumberNotEligiblePage.getHeaderText()).toContain(
        'Sorry, you cannot complete an NHS Health Check online'
      );
    });

    await test.step(`Check if PatientIneligibleInvalidNHSNumber event was created`, async () => {
      const lastMessage =
        await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
          mockedNotWhitelistedNhsNumber.nhsNumber,
          AuditEventType.PatientIneligibleInvalidNHSNumber,
          testStartDate
        );
      expect(lastMessage?.nhsNumber).toEqual(
        mockedNotWhitelistedNhsNumber.nhsNumber
      );
    });
  }
);
