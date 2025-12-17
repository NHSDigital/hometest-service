import { test, expect } from '../../fixtures/commonFixture';
import { ConfirmBloodPressureValueOptions } from '../../page-objects/BloodPressurePages/ConfirmBloodPressureReadingsPage';
import { LowBloodPressureSymptomOptions } from '../../page-objects/BloodPressurePages/LowBloodPressureSymptomsPage';
import { ScheduledReason } from '../../lib/apiClients/HealthCheckModel';
import { BloodPressureLocation } from '../../lib/enum/health-check-answers';
import {
  HealthCheckFactory,
  HealthCheckType
} from '../../testData/healthCheck/healthCheckFactory';

let healthCheckId: string;

test.beforeEach(async ({ testedUser, dynamoDBServiceUtils }) => {
  healthCheckId =
    await dynamoDBServiceUtils.cleanHealthCheckTableAndAddHealthCheckItem(
      testedUser,
      HealthCheckFactory.createHealthCheck(
        testedUser,
        HealthCheckType.QUESTIONNAIRE_FILLED
      )
    );
});

test.afterEach(
  async ({ testedUser, dbAuditEvent, dbGpUpdateSchedulerService }) => {
    await dbAuditEvent.deleteItemByNhsNumber(testedUser.nhsNumber);
    await dbGpUpdateSchedulerService.deleteGpUpdateSchedulerItemByHealthCheckId(
      healthCheckId
    );
  }
);

test(
  'User enters an urgently low blood pressure',
  {
    tag: ['@ui', '@bloodPressure', '@regression']
  },
  async ({ taskListPage, bloodPressurePages, dbGpUpdateSchedulerService }) => {
    const testStartDate = new Date().toISOString();
    await taskListPage.goToTaskListPageAndWaitForLoading();
    await taskListPage.clickCheckYourPressureLink();
    await bloodPressurePages.checkBloodPressurePage.clickContinueButton();
    await bloodPressurePages.confirmBloodPressureLocationPage.selectBloodPressureOptionsAndClickContinue(
      BloodPressureLocation.Monitor
    );
    await bloodPressurePages.enterYourReadingPage.waitUntilLoaded();

    await test.step('Urgently low systolic value - reading taken at home - no symptoms', async () => {
      for (const systolicValues of [70, 89]) {
        await bloodPressurePages.enterYourReadingPage.fillSystolicAndDiastolicValuesAndClickContinue(
          systolicValues,
          59
        );

        await bloodPressurePages.confirmBloodPressureReadingsPage.waitUntilLoaded();
        await bloodPressurePages.confirmBloodPressureReadingsPage.selectConfirmBloodPressureValueOptionsAndClickContinue(
          ConfirmBloodPressureValueOptions.Yes
        );
        await bloodPressurePages.lowBloodPressureSymptomsPage.selectLowBloodPressureSymptomOptionsAndClickContinue(
          LowBloodPressureSymptomOptions.No
        );
        await bloodPressurePages.enterYourReadingPage.goToEnterYourReadingPage();
      }
    });

    await test.step('Urgently low systolic value - reading taken at home - with symptoms', async () => {
      await bloodPressurePages.enterYourReadingPage.fillSystolicAndDiastolicValuesAndClickContinue(
        70,
        59
      );
      await bloodPressurePages.confirmBloodPressureReadingsPage.waitUntilLoaded();
      await bloodPressurePages.confirmBloodPressureReadingsPage.selectConfirmBloodPressureValueOptionsAndClickContinue(
        ConfirmBloodPressureValueOptions.Yes
      );
      await bloodPressurePages.lowBloodPressureSymptomsPage.waitUntilLoaded();
      await bloodPressurePages.lowBloodPressureSymptomsPage.selectLowBloodPressureSymptomOptionsAndClickContinue(
        LowBloodPressureSymptomOptions.Yes
      );
      await bloodPressurePages.lowBloodPressureShutterPage.waitUntilLoaded();
    });

    await test.step('Check if UrgentLowBP Gp Schedule Item was created in the DB', async () => {
      const expectedGpSchedulerItem =
        await dbGpUpdateSchedulerService.waitForGpSchedulerItemsByHealthCheckId(
          healthCheckId,
          ScheduledReason.UrgentLowBP,
          testStartDate
        );
      expect(expectedGpSchedulerItem).toBeTruthy();
    });

    await test.step('Check if we are redirected to shutter screen after trying to visit task list page', async () => {
      await taskListPage.goToTaskListPage();
      await bloodPressurePages.lowBloodPressureShutterPage.waitUntilLoaded();
      expect(
        await bloodPressurePages.lowBloodPressureShutterPage.getPageHeaderText()
      ).toContain('You cannot complete your NHS Health Check online');
    });
  }
);
