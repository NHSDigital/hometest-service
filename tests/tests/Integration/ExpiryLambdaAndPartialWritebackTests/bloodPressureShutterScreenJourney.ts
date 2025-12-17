import { expect, test } from '../../../fixtures/commonFixture';
import { BloodPressureLocation } from '../../../lib/enum/health-check-answers';
import {
  HealthCheckSteps,
  MnsMessageStatus,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
import {
  checkPdmCloudWatchForLogs,
  cleanupE2EUserData,
  initializeEmailHelper
} from '../../E2E/E2ECommonMethods';
import type { GpEmailTestHelper } from '../../../lib/email/GpEmailTestHelper';
import {
  EligibilitySectionDataFactory,
  EligibilitySectionDataType
} from '../../../lib/flows/EligibilitySection/EligibilitySectionDataFactory';
import { EligibilitySectionFlow } from '../../../lib/flows/EligibilitySection/EligibilitySectionFlow';
import {
  PhysicalActivitySectionDataFactory,
  PhysicalActivitySectionDataType
} from '../../../lib/flows/PhysicalActivitySection/PhysicalActivitySectionDataFactory';
import { PhysicalActivitySectionFlow } from '../../../lib/flows/PhysicalActivitySection/PhysicalActivitySectionFlow';
import {
  AlcoholConsumptionSectionDataFactory,
  AlcoholConsumptionSectionDataType
} from '../../../lib/flows/AlcoholConsumptionSection/AlcoholConsumptionSectionDataFactory';
import { AlcoholConsumptionSectionFlow } from '../../../lib/flows/AlcoholConsumptionSection/AlcoholConsumptionSectionFlow';
import {
  AboutYouSectionDataFactory,
  AboutYouSectionDataType
} from '../../../lib/flows/AboutYouSection/AboutYouSectionDataFactory';
import { AboutYouSectionFlow } from '../../../lib/flows/AboutYouSection/AboutYouSectionFlow';
import {
  BodyMeasurementsSectionDataFactory,
  BodyMeasurementsSectionDataType
} from '../../../lib/flows/BodyMeasurementsSection/BodyMeasurementsSectionDataFactory';
import { BodyMeasurementsSectionFlow } from '../../../lib/flows/BodyMeasurementsSection/BodyMeasurementsSectionFlow';
import {
  HealthCheckFactory,
  HealthCheckType
} from '../../../testData/healthCheck/healthCheckFactory';

let healthCheckToCreate: IHealthCheck;
let gpEmailHelper: GpEmailTestHelper;

export default function bloodPressureShutterScreenJourneyTests() {
  test.beforeEach(
    'Clearing data before test and initialising health check in db',
    async ({
      testedUser,
      dbHealthCheckService,
      dbLabOrderService,
      dbLabResultService,
      dbAuditEvent,
      dbMnsCommunicationLogService,
      config
    }) => {
      await cleanupE2EUserData(
        dbLabOrderService,
        dbLabResultService,
        dbHealthCheckService,
        dbAuditEvent,
        dbMnsCommunicationLogService,
        testedUser
      );
      healthCheckToCreate = HealthCheckFactory.createHealthCheck(
        testedUser,
        HealthCheckType.INITIAL
      );
      await dbHealthCheckService.createHealthCheck(healthCheckToCreate);
      gpEmailHelper = initializeEmailHelper(config, testedUser.nhsNumber);
      await gpEmailHelper.setupGpEmailTest();
    }
  );

  test.afterEach(
    'Deleting a health check, lab order and lab results after tests',
    async ({
      testedUser,
      dbLabOrderService,
      dbLabResultService,
      dbHealthCheckService,
      dbMnsCommunicationLogService,
      dbAuditEvent
    }) => {
      await cleanupE2EUserData(
        dbLabOrderService,
        dbLabResultService,
        dbHealthCheckService,
        dbAuditEvent,
        dbMnsCommunicationLogService,
        testedUser
      );
      await gpEmailHelper.cleanupGpEmailTest(false);
    }
  );

  test(
    'E2E - High blood pressure shutter screen journey with EMIS, PDM and Email integration',
    { tag: ['@ui', '@e2e', '@regression'] },
    async ({
      config,
      taskListPage,
      nhsLoginPages,
      bloodPressurePages,
      dbHealthCheckService,
      page,
      pdmCloudWatchService,
      testedUser,
      dbMnsCommunicationLogService,
      nhcGpUpdateScheduleProcessorLambdaService
    }) => {
      test.setTimeout(240000);

      await test.step('Complete eligibility sections and go to the task list page', async () => {
        await nhsLoginPages.nhsFirstPage.goToTheQuestionnaireAppURL();
        const data = new EligibilitySectionDataFactory(
          EligibilitySectionDataType.ELIGIBLE_USER
        ).getData();
        await new EligibilitySectionFlow(data, page).completeSection();
        await taskListPage.waitUntilLoaded();
      });

      await test.step('Complete the About you section', async () => {
        const data = new AboutYouSectionDataFactory(
          AboutYouSectionDataType.HIGH_RISK_ASIAN_MALE
        ).getData();
        await new AboutYouSectionFlow(data, page, false).completeSection();
      });

      await test.step('Complete the Physical activity section', async () => {
        const data = new PhysicalActivitySectionDataFactory(
          PhysicalActivitySectionDataType.HIGH_RISK_PATIENT
        ).getData();
        await new PhysicalActivitySectionFlow(data, page).completeSection();
      });

      await test.step('Complete the Alcohol consumption section', async () => {
        const data = new AlcoholConsumptionSectionDataFactory(
          AlcoholConsumptionSectionDataType.HEAVY_DRINKING
        ).getData();
        await new AlcoholConsumptionSectionFlow(data, page).completeSection();
      });

      await test.step('Complete the Body measurements section', async () => {
        const data = new BodyMeasurementsSectionDataFactory(
          BodyMeasurementsSectionDataType.UNHEALTHY_BMI
        ).getData();
        await new BodyMeasurementsSectionFlow(
          data,
          page,
          true
        ).completeSection();
      });

      await test.step('Complete the blood pressure section', async () => {
        await taskListPage.clickCheckYourPressureLink();
        await bloodPressurePages.checkBloodPressurePage.waitUntilLoaded();
        await bloodPressurePages.checkBloodPressurePage.clickContinueButton();
        await bloodPressurePages.confirmBloodPressureLocationPage.waitUntilLoaded();
        await bloodPressurePages.confirmBloodPressureLocationPage.selectBloodPressureOptionsAndClickContinue(
          BloodPressureLocation.Pharmacy
        );
        await bloodPressurePages.enterYourReadingPage.waitUntilLoaded();
        await bloodPressurePages.enterYourReadingPage.fillSystolicAndDiastolicValuesAndClickContinue(
          180,
          150
        );
        await bloodPressurePages.confirmBloodPressureReadingsPage.waitUntilLoaded();
        await bloodPressurePages.confirmBloodPressureReadingsPage.yesRadioButton.click();
        await bloodPressurePages.confirmBloodPressureReadingsPage.clickContinueButton();
        await bloodPressurePages.bloodPressureVeryHighShutterPage.waitUntilLoaded();
      });

      await test.step('Navigate to the task list page and verify shutter screen is shown there', async () => {
        await taskListPage.goToTaskListPage();
        await bloodPressurePages.bloodPressureVeryHighShutterPage.waitUntilLoaded();
      });

      await test.step('Trigger GP update scheduler lambda', async () => {
        const response =
          await nhcGpUpdateScheduleProcessorLambdaService.triggerLambda();
        expect(response.$metadata.httpStatusCode).toEqual(200);
      });

      await test.step('Check PDM CloudWatch logs', async () => {
        await checkPdmCloudWatchForLogs(
          healthCheckToCreate.id,
          pdmCloudWatchService
        );
      });

      if (config.mnsIntegrationEnabled) {
        await test.step('Check MNS outbound message sent', async () => {
          const mnsMessageLog =
            await dbMnsCommunicationLogService.waitForItemByHealthCheckId(
              healthCheckToCreate.id
            );
          expect(
            mnsMessageLog.nhsNumber,
            'MNS message NHS number does not match'
          ).toBe(testedUser.nhsNumber);
          expect(mnsMessageLog.status, 'MNS message status is not SENT').toBe(
            MnsMessageStatus.SENT
          );
        });
      }

      await test.step('Check that email has been sent to GP', async () => {
        await gpEmailHelper.verifyEmailHasBeenSent();
      });

      await test.step('Check Health Check status is INIT', async () => {
        // Wait max 1 minute calling for results every 10 seconds
        const checkHealthCheckStatus =
          await dbHealthCheckService.waitForHealthCheckStepStatusToBeUpdatedByHealthCheckId(
            healthCheckToCreate.id,
            HealthCheckSteps.INIT,
            15,
            3000
          );
        expect(
          checkHealthCheckStatus,
          'The HealthCheck step was not updated by EMIS service'
        ).toBeTruthy();
      });
    }
  );
}
