import { test, expect } from '../../../fixtures/commonFixture';
import { type Config, ConfigFactory } from '../../../env/config';
import { CredentialsHelper } from '../../../lib/CredentialsHelper';
import NhsLoginHelper from '../../../page-objects/NhsLoginHelper';
import { AuditEventType } from '@dnhc-health-checks/shared';
import { EligibilitySectionFlow } from '../../../lib/flows/EligibilitySection/EligibilitySectionFlow';
import {
  EligibilitySectionDataFactory,
  EligibilitySectionDataType
} from '../../../lib/flows/EligibilitySection/EligibilitySectionDataFactory';
import type { NHSLoginUser } from '../../../lib/users/BaseUser';
import { SpecialUserKey } from '../../../lib/users/SpecialUserKey';
import { UrlParameterType } from '../../../lib/enum/url-parameter-type';

const config: Config = ConfigFactory.getConfig();
const nhsLoginHelper = new NhsLoginHelper();
let nhsLoginTestUser: NHSLoginUser;

export default function checkNewUserCanLoginFromInviteOrReminderAndUrlSourceIsCapturedInAuditEventDetails(): void {
  [
    { urlParameter: UrlParameterType.Invite, skipOnInt: false },
    { urlParameter: UrlParameterType.NewInviteParam, skipOnInt: true },
    { urlParameter: UrlParameterType.Reminder, skipOnInt: true }
  ].forEach(({ urlParameter, skipOnInt }) => {
    test.describe('New user login from invite or reminder url', () => {
      test.skip(skipOnInt === true && config.integratedEnvironment);
      test.beforeEach(
        async ({ dbHealthCheckService, dbAuditEvent, userManager }) => {
          nhsLoginTestUser = userManager.getSpecialUser(
            SpecialUserKey.LOGOUT_DEDICATED_USER
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
        `Verify a first time user can login from invite/reminder parameter ${urlParameter} url and only the online exclusions screen is displayed in the Check Eligibility section`,
        {
          tag: ['@ui', '@regression', '@happyPath', '@invite']
        },
        async ({
          context,
          page,
          nhsLoginPages,
          completeHealthCheckFirstPage,
          termsAndConditionsPage,
          eligibilityPages,
          dbAuditEvent,
          config
        }) => {
          await context.clearCookies();
          const testStartDate = new Date().toISOString();
          if (config.integratedEnvironment) {
            await nhsLoginPages.nhsFirstPage.goToTheQuestionnaireAppWithUrlParameterAndClickContinue(
              urlParameter
            );
            await nhsLoginPages.nhsAppRedirectorPage.waitUntilLoadedAndClickContinue();
            await nhsLoginHelper.fillNhsLoginFormsAndWaitForNextPage(
              nhsLoginTestUser,
              page
            );
          } else {
            await nhsLoginPages.nhsFirstPage.goToTheQuestionnaireAppURLWithLoginMockAndInviteParameter(
              nhsLoginTestUser.code as string,
              urlParameter
            );
          }
          await test.step('Check if PatientLoggedIn event with url source details was created', async () => {
            const dBAuditEventItem =
              await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
                nhsLoginTestUser.nhsNumber,
                AuditEventType.PatientLoggedIn,
                testStartDate
              );
            expect(dBAuditEventItem).toBeTruthy();
            expect(dBAuditEventItem?.details?.urlSource).toEqual(urlParameter);
          });

          await test.step('Start health check and accept terms and conditions', async () => {
            await completeHealthCheckFirstPage.waitUntilLoaded();
            await completeHealthCheckFirstPage.clickStartNowBtn();
            await termsAndConditionsPage.waitUntilLoaded();
            await termsAndConditionsPage.checkAcceptTermsBoxAndClickAcceptAndContinueButton();
            await eligibilityPages.whoShouldNotUseThisOnlineServicePage.waitUntilLoaded();
          });

          await test.step('Complete Check eligibility section and verify only the online exclusions screen is displayed', async () => {
            const data = new EligibilitySectionDataFactory(
              EligibilitySectionDataType.ELIGIBLE_USER_COMING_FROM_INVITE_LINK
            ).getData();
            await new EligibilitySectionFlow(
              data,
              page
            ).newUserFromInviteOrReminderCheckEligibility();
          });
        }
      );
    });
  });
}
