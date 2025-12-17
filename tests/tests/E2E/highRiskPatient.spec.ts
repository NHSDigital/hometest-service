import { expect, test } from '../../fixtures/commonFixture';
import { BloodPressureLocation } from '../../lib/enum/health-check-answers';
import {
  HealthCheckSteps,
  MnsMessageStatus,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
import { patientOdsCodeForThrivaIntegration } from '../../testData/patientTestData';
import {
  getLabResults,
  LabResultsData
} from '../../testData/labResultsTestData';
import {
  checkPdmCloudWatchForLogs,
  cleanupE2EUserData,
  initializeEmailHelper
} from './E2ECommonMethods';
import type { GpEmailTestHelper } from '../../lib/email/GpEmailTestHelper';
import {
  EligibilitySectionDataFactory,
  EligibilitySectionDataType
} from '../../lib/flows/EligibilitySection/EligibilitySectionDataFactory';
import { EligibilitySectionFlow } from '../../lib/flows/EligibilitySection/EligibilitySectionFlow';
import {
  PhysicalActivitySectionDataFactory,
  PhysicalActivitySectionDataType
} from '../../lib/flows/PhysicalActivitySection/PhysicalActivitySectionDataFactory';
import { PhysicalActivitySectionFlow } from '../../lib/flows/PhysicalActivitySection/PhysicalActivitySectionFlow';
import {
  AlcoholConsumptionSectionDataFactory,
  AlcoholConsumptionSectionDataType
} from '../../lib/flows/AlcoholConsumptionSection/AlcoholConsumptionSectionDataFactory';
import { AlcoholConsumptionSectionFlow } from '../../lib/flows/AlcoholConsumptionSection/AlcoholConsumptionSectionFlow';
import {
  AboutYouSectionDataFactory,
  AboutYouSectionDataType
} from '../../lib/flows/AboutYouSection/AboutYouSectionDataFactory';
import { AboutYouSectionFlow } from '../../lib/flows/AboutYouSection/AboutYouSectionFlow';
import {
  BodyMeasurementsSectionDataFactory,
  BodyMeasurementsSectionDataType
} from '../../lib/flows/BodyMeasurementsSection/BodyMeasurementsSectionDataFactory';
import { BodyMeasurementsSectionFlow } from '../../lib/flows/BodyMeasurementsSection/BodyMeasurementsSectionFlow';
import {
  HealthCheckFactory,
  HealthCheckType
} from '../../testData/healthCheck/healthCheckFactory';

let healthCheckToCreate: IHealthCheck;
let gpEmailHelper: GpEmailTestHelper;

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
  'E2E - High Risk Patient',
  { tag: ['@ui', '@e2e'] },
  async ({
    testedUser,
    taskListPage,
    nhsLoginPages,
    bloodPressurePages,
    submitAndReviewPages,
    bloodTestPages,
    dbLabOrderService,
    dbHealthCheckService,
    resultsPages,
    dbPatientService,
    labResultsApiResource,
    config,
    dbMnsCommunicationLogService,
    pdmCloudWatchService,
    page
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
      await new BodyMeasurementsSectionFlow(data, page, true).completeSection();
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
        140,
        90
      );
      await bloodPressurePages.checkYourAnswersPage.waitUntilLoaded();
      await bloodPressurePages.checkYourAnswersPage.clickSaveAndContinueButton();
      await taskListPage.waitUntilLoaded();
    });

    await test.step('Submit final Check your answers page', async () => {
      await taskListPage.clickReviewAndSubmitLink();
      await submitAndReviewPages.checkYourAnswersReviewSubmitPage.waitUntilLoaded();
      await submitAndReviewPages.checkYourAnswersReviewSubmitPage.clickSubmitButton();

      await bloodTestPages.orderBloodTestKitPage.waitUntilLoaded();
    });

    await test.step('Order blood test kit', async () => {
      if (config.integratedEnvironment) {
        await dbPatientService.updatePatientOdsCode(
          testedUser.nhsNumber,
          patientOdsCodeForThrivaIntegration
        );
      }

      await bloodTestPages.orderBloodTestKitPage.clickContinueButton();
      await bloodTestPages.findDeliveryAddressPage.waitUntilLoaded();
      await bloodTestPages.findDeliveryAddressPage.clickEnterAddressManuallyLink();
      await bloodTestPages.enterDeliveryAddressPage.waitUntilLoaded();
      await bloodTestPages.enterDeliveryAddressPage.fillAddressLine1Field(
        '1 My Street'
      );
      await bloodTestPages.enterDeliveryAddressPage.fillTownCityField('London');
      await bloodTestPages.enterDeliveryAddressPage.fillPostcodeField('FY83SY');
      await bloodTestPages.enterDeliveryAddressPage.clickContinueButton();
      await bloodTestPages.enterPhoneNumberPage.waitUntilLoaded();
      await bloodTestPages.enterPhoneNumberPage.clickContinueButton();
      await bloodTestPages.confirmDetailsPage.waitUntilLoaded();
      await bloodTestPages.confirmDetailsPage.clickSaveAndContinueButton();
      await bloodTestPages.bloodTestOrderedPage.waitUntilLoaded();
    });

    if (!config.integratedEnvironment) {
      await test.step('Simulate Thriva response to results API', async () => {
        const healthCheckId = await dbHealthCheckService.getIdByNhsNumber(
          testedUser.nhsNumber
        );
        const orders =
          await dbLabOrderService.getLabOrderByHealthCheckId(healthCheckId);
        expect(
          orders.length > 0,
          `There are no orders for this health check ${healthCheckId}`
        ).toBeTruthy();
        const labResultsAndScoresTestData = {
          orderId: 'TEST87654323',
          orderExternalReference: orders[0].id,
          resultData: getLabResults(
            LabResultsData.SuccessCholesterolHbA1cHighRisk
          ),
          resultDate: new Date().toISOString(),
          pendingReorder: false
        };

        await labResultsApiResource.sendLabResults(labResultsAndScoresTestData);
      });
    }

    await test.step('Wait for Thriva to send the results', async () => {
      test.setTimeout(600000);
      // Wait max 6 minutes calling for results every 10 seconds
      const areThrivaResultsRetrieved =
        await dbHealthCheckService.waitForKeyToBePresentByHealthCheckId(
          healthCheckToCreate.id,
          'biometricScores',
          48,
          10000
        );
      expect(
        areThrivaResultsRetrieved,
        'Thriva results were not retrieved'
      ).toBeTruthy();
    });

    await test.step('Check Health Check status has been updated to GP_UPDATE_SUCCESS', async () => {
      // Wait max 1 minute calling for results every 10 seconds
      const isHealthCheckStepUpdated =
        await dbHealthCheckService.waitForHealthCheckStepStatusToBeUpdatedByHealthCheckId(
          healthCheckToCreate.id,
          HealthCheckSteps.GP_UPDATE_SUCCESS,
          30,
          3000
        );
      expect(
        isHealthCheckStepUpdated,
        'The HealthCheck step was not updated by EMIS service'
      ).toBeTruthy();
    });

    await test.step('Check if results page is loaded', async () => {
      await resultsPages.mainResultsPage.refreshPage();
      await resultsPages.mainResultsPage.waitUntilLoaded();
    });

    await test.step('Check PDM CloudWatch logs', async () => {
      await checkPdmCloudWatchForLogs(
        healthCheckToCreate.id,
        pdmCloudWatchService
      );
    });

    await test.step('Check that email has been sent to GP', async () => {
      await gpEmailHelper.verifyEmailHasBeenSent();
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
  }
);
