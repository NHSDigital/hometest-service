import { test, expect } from '../../fixtures/commonFixture';
import AxeBuilder from '@axe-core/playwright';
import { type Result } from 'axe-core';
import {
  createHtmlAccessibilityReport,
  tagList
} from '../../lib/AccessibilityTestReportHelper';
import NhsLoginHelper from '../../page-objects/NhsLoginHelper';
import { dataModelVersion } from '../../testData/partialBloodResultsE2ETestData';
import { HealthCheckBuilder } from '../../testData/healthCheck/healthCheckBuilder';
import type {
  NHSLoginMockedUser,
  NHSLoginUser
} from '../../lib/users/BaseUser';

const nhsLoginHelper = new NhsLoginHelper();

const accessErrors: Result[] = [];

test.beforeEach(
  async ({
    page,
    context,
    nhsLoginPages,
    testedUser,
    dbPatientService,
    dynamoDBServiceUtils,
    config
  }) => {
    await context.clearCookies();
    await dbPatientService.updatePatientAcceptedTermsVersion(
      testedUser.nhsNumber
    );
    await dynamoDBServiceUtils.cleanHealthCheckTableAndAddHealthCheckItem(
      testedUser,
      new HealthCheckBuilder(testedUser)
        .withDataModelVersion(dataModelVersion.V1_0_0)
        .build()
    );

    if (!config.integratedEnvironment) {
      await nhsLoginPages.nhsFirstPage.goToTheQuestionnaireAppURLWithLoginMock(
        (testedUser as NHSLoginMockedUser).code
      );
    } else {
      await nhsLoginPages.nhsFirstPage.goToTheQuestionnaireAppUrlAndClickContinue();
      await nhsLoginPages.nhsAppRedirectorPage.waitUntilLoadedAndClickContinue();
      await nhsLoginHelper.fillNhsLoginFormsAndWaitForNextPage(
        testedUser as NHSLoginUser,
        page
      );
    }
  }
);

test.afterEach(
  'Deleting a health check and events items from Db after test',
  async ({ testedUser, dbAuditEvent, dbHealthCheckService }) => {
    await dbAuditEvent.deleteItemByNhsNumber(testedUser.nhsNumber);
    await dbHealthCheckService.deleteItemByNhsNumber(testedUser.nhsNumber);
  }
);

test(
  'HealthCheckVersionMigration Accessibility tests',
  {
    tag: ['@accessibility', '@regression']
  },
  async ({ page, healthCheckVersionMigrationPage }) => {
    let accessibilityScanResults;

    await test.step('Go to Start Health Check page', async () => {
      await healthCheckVersionMigrationPage.waitUntilLoaded();
      accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(tagList)
        .analyze();
      accessErrors.push(
        ...(await createHtmlAccessibilityReport(
          accessibilityScanResults,
          'HealthCheckVersionMigrationPage',
          'Initial Screens',
          healthCheckVersionMigrationPage
        ))
      );
    });

    await test.step('Check accessibility errors', () => {
      expect(accessErrors).toHaveLength(0);
    });
  }
);
