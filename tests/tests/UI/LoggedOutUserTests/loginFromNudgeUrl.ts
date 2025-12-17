import { test, expect } from '../../../fixtures/commonFixture';
import { type Config, ConfigFactory } from '../../../env/config';
import { CredentialsHelper } from '../../../lib/CredentialsHelper';
import NhsLoginHelper from '../../../page-objects/NhsLoginHelper';
import { AuditEventType } from '@dnhc-health-checks/shared';
import type { NHSLoginUser } from '../../../lib/users/BaseUser';
import { SpecialUserKey } from '../../../lib/users/SpecialUserKey';
import { UrlParameterType } from '../../../lib/enum/url-parameter-type';

const config: Config = ConfigFactory.getConfig();
const nhsLoginHelper = new NhsLoginHelper();
let nhsLoginTestUser: NHSLoginUser;

export default function checkUserCanLoginFromNudgeAndUrlSourceIsCapturedInAuditEventDetails(): void {
  test.describe('Login from nudge url', () => {
    test.skip(!config.integratedEnvironment);
    test.beforeEach(
      async ({ dbHealthCheckService, dbAuditEvent, userManager }) => {
        nhsLoginTestUser = userManager.getSpecialUser(
          SpecialUserKey.ELIGIBLE_USER_2
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
      'Verify user can login from nudge url and the url source is captured in the PatientLoggedIn audit event',
      {
        tag: ['@ui', '@regression', '@happyPath', '@nudge']
      },
      async ({ context, page, dbAuditEvent, nhsLoginPages }) => {
        await context.clearCookies();
        const testStartDate = new Date().toISOString();

        await nhsLoginPages.nhsFirstPage.goToTheQuestionnaireAppWithUrlParameterAndClickContinue(
          UrlParameterType.Nudge
        );
        await nhsLoginPages.nhsAppRedirectorPage.waitUntilLoadedAndClickContinue();
        await nhsLoginHelper.fillNhsLoginFormsAndWaitForNextPage(
          nhsLoginTestUser,
          page
        );

        await test.step('Check if PatientLoggedIn event with url source details was created', async () => {
          const dBAuditEventItem =
            await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
              nhsLoginTestUser.nhsNumber,
              AuditEventType.PatientLoggedIn,
              testStartDate
            );
          expect(dBAuditEventItem).toBeTruthy();
          expect(dBAuditEventItem?.details?.urlSource).toEqual(
            UrlParameterType.Nudge.toUpperCase()
          );
        });

        await test.step('Check if PatientLoggedInToNhsLogin event with url source details was created', async () => {
          const dBAuditEventItem =
            await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
              nhsLoginTestUser.nhsNumber,
              AuditEventType.PatientLoggedInToNhsLogin as string,
              testStartDate
            );
          expect(dBAuditEventItem).toBeTruthy();
          expect(dBAuditEventItem?.details?.urlSource).toEqual(
            UrlParameterType.Nudge.toUpperCase()
          );
        });
      }
    );
  });
}
