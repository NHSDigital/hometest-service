import { test, expect } from '../../../fixtures/commonFixture';
import { type Config, ConfigFactory } from '../../../env/config';
import {
  createHtmlAccessibilityReport,
  tagList
} from '../../../lib/AccessibilityTestReportHelper';
import NhsLoginHelper from '../../../page-objects/NhsLoginHelper';

import DbHealthCheckService from '../../../lib/aws/dynamoDB/DbHealthCheckService';
import AxeBuilder from '@axe-core/playwright';
import { type Result } from 'axe-core';
import { SpecialUserKey } from '../../../lib/users/SpecialUserKey';
import type {
  NHSLoginMockedUser,
  NHSLoginUser
} from '../../../lib/users/BaseUser';

const config: Config = ConfigFactory.getConfig();
const dbHealthCheckService = new DbHealthCheckService(config.name);
let testedLogoutUser: NHSLoginUser | NHSLoginMockedUser;
const nhsLoginHelper = new NhsLoginHelper();
const accessErrors: Result[] = [];

export default function logoutPageAccessibilityTest(): void {
  test.use({ storageState: { cookies: [], origins: [] } });
  test.beforeEach(async ({ page, context, nhsLoginPages, userManager }) => {
    await context.clearCookies();
    if (!config.integratedEnvironment) {
      testedLogoutUser = userManager.getSpecialUser(
        SpecialUserKey.LOGOUT_DEDICATED_USER
      ) as NHSLoginMockedUser;
      await dbHealthCheckService.deleteItemByNhsNumber(
        testedLogoutUser.nhsNumber
      );
      await nhsLoginPages.nhsFirstPage.goToTheQuestionnaireAppURLWithLoginMock(
        testedLogoutUser.code
      );
    } else {
      testedLogoutUser = userManager.getSpecialUser(
        SpecialUserKey.LOGOUT_DEDICATED_USER
      ) as NHSLoginUser;

      await dbHealthCheckService.deleteItemByNhsNumber(
        testedLogoutUser.nhsNumber
      );
      await dbHealthCheckService.deleteItemByNhsNumber(
        testedLogoutUser.nhsNumber
      );
      await nhsLoginPages.nhsFirstPage.goToTheQuestionnaireAppUrlAndClickContinue();
      await nhsLoginPages.nhsAppRedirectorPage.waitUntilLoadedAndClickContinue();
      await nhsLoginHelper.fillNhsLoginFormsAndWaitForNextPage(
        testedLogoutUser as NHSLoginUser,
        page
      );
    }
  });

  test(
    'Logout Accessibility tests',
    {
      tag: ['@accessibility', '@regression']
    },
    async ({ page, completeHealthCheckFirstPage, logoutPage }) => {
      let accessibilityScanResults;
      test.skip(config.integratedEnvironment);

      await test.step('Go to LogoutPage', async () => {
        await completeHealthCheckFirstPage.waitUntilLoaded();
        await completeHealthCheckFirstPage.clickLogoutButton();
        await logoutPage.waitUntilLoaded();

        accessibilityScanResults = await new AxeBuilder({ page })
          .withTags(tagList)
          .analyze();
        accessErrors.push(
          ...(await createHtmlAccessibilityReport(
            accessibilityScanResults,
            'YouHaveLoggedOutPage',
            undefined,
            logoutPage
          ))
        );
      });

      await test.step('Check accessibility errors', () => {
        expect(accessErrors).toHaveLength(0);
      });
    }
  );
}
