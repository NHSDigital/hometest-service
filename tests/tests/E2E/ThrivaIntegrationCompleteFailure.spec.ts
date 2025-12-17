import { test, expect } from '../../fixtures/commonFixture';
import { BloodPressureLocation } from '../../lib/enum/health-check-answers';
import { type DeliverAddress } from '../../lib/apiClients/HealthCheckModel';
import {
  HealthCheckSteps,
  LabTestType,
  type ILabResultData,
  type IHealthCheck,
  type IThrivaLabResults
} from '@dnhc-health-checks/shared';
import {
  getLabResults,
  LabResultsData
} from '../../testData/labResultsTestData';
import { patientOdsCodeForThrivaIntegration } from '../../testData/patientTestData';
import {
  checkLabResultsTypeAndPendingReorderStatus,
  cleanupE2EUserData,
  initializeEmailHelper
} from './E2ECommonMethods';
import type { GpEmailTestHelper } from '../../lib/email/GpEmailTestHelper';
import { AlcoholConsumptionSectionFlow } from '../../lib/flows/AlcoholConsumptionSection/AlcoholConsumptionSectionFlow';
import {
  EligibilitySectionDataFactory,
  EligibilitySectionDataType
} from '../../lib/flows/EligibilitySection/EligibilitySectionDataFactory';
import { EligibilitySectionFlow } from '../../lib/flows/EligibilitySection/EligibilitySectionFlow';
import {
  PhysicalActivitySectionDataFactory,
  PhysicalActivitySectionDataType
} from '../../lib/flows/PhysicalActivitySection/PhysicalActivitySectionDataFactory';
import {
  AlcoholConsumptionSectionDataFactory,
  AlcoholConsumptionSectionDataType
} from '../../lib/flows/AlcoholConsumptionSection/AlcoholConsumptionSectionDataFactory';
import { PhysicalActivitySectionFlow } from '../../lib/flows/PhysicalActivitySection/PhysicalActivitySectionFlow';
import {
  AboutYouSectionDataFactory,
  AboutYouSectionDataType
} from '../../lib/flows/AboutYouSection/AboutYouSectionDataFactory';
import { AboutYouSectionFlow } from '../../lib/flows/AboutYouSection/AboutYouSectionFlow';
import type { LabOrderItem } from '../../lib/aws/dynamoDB/DbLabOrderService';
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
let labOrders: LabOrderItem[];
let labResult: ILabResultData[];

function getThrivaLabResultsBodyRequest(
  labOrderId: string,
  labResult: ILabResultData[],
  pendingReorder: boolean
): IThrivaLabResults {
  return {
    orderId: 'TEST5432137',
    orderExternalReference: labOrderId,
    resultData: labResult,
    pendingReorder: pendingReorder,
    resultDate: new Date().toISOString()
  };
}

test.beforeEach(
  'Clearing data before test and initializing health check in db',
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
    dbAuditEvent,
    dbMnsCommunicationLogService
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
  'E2E - Thriva Integration Complete Failure',
  { tag: ['@ui', '@e2e', '@regression'] },
  async ({
    testedUser,
    dbHealthCheckService,
    dbLabOrderService,
    dbLabResultService,
    taskListPage,
    nhsLoginPages,
    bloodPressurePages,
    submitAndReviewPages,
    bloodTestPages,
    dbPatientService,
    labResultsApiResource,
    config,
    page
  }) => {
    test.setTimeout(90000);

    await test.step('Complete eligibility sections and go to the task list page', async () => {
      await nhsLoginPages.nhsFirstPage.goToTheQuestionnaireAppURL();
      const data = new EligibilitySectionDataFactory(
        EligibilitySectionDataType.ELIGIBLE_USER
      ).getData();
      await new EligibilitySectionFlow(data, page).completeSection();
      await taskListPage.goToTaskListPageAndWaitForLoading();
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

    await test.step('Place a blood test order - user journey', async () => {
      if (config.integratedEnvironment) {
        await dbPatientService.updatePatientOdsCode(
          testedUser.nhsNumber,
          patientOdsCodeForThrivaIntegration
        );
      }
      const address: DeliverAddress = {
        addressLine1: 'Complete Failure',
        postcode: 'SW1 1AE',
        townCity: 'London'
      };
      await taskListPage.goToTaskListPageAndWaitForLoading();
      await taskListPage.clickOrderABloodTestKitLink();

      await bloodTestPages.orderBloodTestKitPage.waitUntilLoaded();
      await bloodTestPages.orderBloodTestKitPage.clickContinueButton();

      await bloodTestPages.findDeliveryAddressPage.waitUntilLoaded();
      await bloodTestPages.findDeliveryAddressPage.clickEnterAddressManuallyLink();

      await bloodTestPages.enterDeliveryAddressPage.fillDeliveryAddressFields(
        address
      );
      await bloodTestPages.enterDeliveryAddressPage.clickContinueButton();

      await bloodTestPages.enterPhoneNumberPage.waitUntilLoaded();
      await bloodTestPages.enterPhoneNumberPage.clickContinueButton();

      await bloodTestPages.confirmDetailsPage.waitUntilLoaded();
      await bloodTestPages.confirmDetailsPage.clickSaveAndContinueButton();
      await bloodTestPages.bloodTestOrderedPage.waitUntilLoaded();
    });

    if (!config.integratedEnvironment) {
      await test.step('Simulate Thriva response pendingReorder: true to results API', async () => {
        labOrders = await dbLabOrderService.getLabOrderByHealthCheckId(
          healthCheckToCreate.id
        );
        if (labOrders === undefined || labOrders.length === 0) {
          throw new Error('Lab Order was not found');
        }
        labResult = getLabResults(
          LabResultsData.PartialResultsHbA1CFailedAndCHOfailed
        );

        const response = await labResultsApiResource.sendLabResults(
          getThrivaLabResultsBodyRequest(labOrders[0].id, labResult, true)
        );
        expect(response.status()).toBe(201);
      });

      await test.step('Expect health check item step to be "LAB_ORDERS_PLACED" when complete failure scenario occures', async () => {
        const healthCheck =
          await dbHealthCheckService.getLatestHealthCheckItemsByNhsNumber(
            testedUser.nhsNumber
          );
        if (healthCheck === undefined) {
          throw new Error('Health check was not found');
        }
        const isStatusUpdated =
          await dbHealthCheckService.waitForHealthCheckStepStatusToBeUpdatedByHealthCheckId(
            healthCheck?.id,
            HealthCheckSteps.LAB_ORDERS_PLACED
          );
        expect(
          isStatusUpdated,
          'Health check status is not update to LAB_ORDER_PLACED'
        ).toBe(true);
      });

      await test.step('Wait for lab results with pendingReorder:true to be added in the db', async () => {
        await checkLabResultsTypeAndPendingReorderStatus(
          dbLabResultService,
          healthCheckToCreate.id,
          LabTestType.HbA1c,
          true
        );

        await checkLabResultsTypeAndPendingReorderStatus(
          dbLabResultService,
          healthCheckToCreate.id,
          LabTestType.Cholesterol,
          true
        );
      });

      await test.step('Simulate Thriva response with pendingReorder: false to results', async () => {
        const response = await labResultsApiResource.sendLabResults(
          getThrivaLabResultsBodyRequest(labOrders[0].id, labResult, false)
        );
        expect(response.status()).toBe(201);
      });

      await test.step('Wait for lab results with pendingReorder:false to be added in the db', async () => {
        await checkLabResultsTypeAndPendingReorderStatus(
          dbLabResultService,
          healthCheckToCreate.id,
          LabTestType.HbA1c,
          false
        );

        await checkLabResultsTypeAndPendingReorderStatus(
          dbLabResultService,
          healthCheckToCreate.id,
          LabTestType.Cholesterol,
          false
        );
      });

      await test.step('Check that email has not been sent to GP', async () => {
        await gpEmailHelper.verifyEmailHasNotBeenSent();
      });
    } else {
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

      await test.step('Wait for lab results with pendingReorder:true to be added in the db', async () => {
        await checkLabResultsTypeAndPendingReorderStatus(
          dbLabResultService,
          healthCheckToCreate.id,
          LabTestType.HbA1c,
          true,
          20
        );

        await checkLabResultsTypeAndPendingReorderStatus(
          dbLabResultService,
          healthCheckToCreate.id,
          LabTestType.Cholesterol,
          true,
          20
        );
      });

      await test.step('Check Health Check status has been updated to LAB_ORDERS_PLACED', async () => {
        const isHealthCheckStepUpdated =
          await dbHealthCheckService.waitForHealthCheckStepStatusToBeUpdatedByHealthCheckId(
            healthCheckToCreate.id,
            HealthCheckSteps.LAB_ORDERS_PLACED,
            20,
            3000
          );
        expect(
          isHealthCheckStepUpdated,
          'The HealthCheck step was not correctly updated'
        ).toBeTruthy();
      });

      await test.step('Wait for lab results with pendingReorder:false to be added in the db', async () => {
        await checkLabResultsTypeAndPendingReorderStatus(
          dbLabResultService,
          healthCheckToCreate.id,
          LabTestType.HbA1c,
          false,
          50
        );

        await checkLabResultsTypeAndPendingReorderStatus(
          dbLabResultService,
          healthCheckToCreate.id,
          LabTestType.Cholesterol,
          false,
          50
        );
      });
    }

    await test.step('Check Health Check status has been updated to GP_UPDATE_SUCCESS', async () => {
      const isHealthCheckStepUpdated =
        await dbHealthCheckService.waitForHealthCheckStepStatusToBeUpdatedByHealthCheckId(
          healthCheckToCreate.id,
          HealthCheckSteps.GP_UPDATE_SUCCESS,
          20,
          3000
        );
      expect(
        isHealthCheckStepUpdated,
        'The HealthCheck step was not updated by EMIS service'
      ).toBeTruthy();
    });
  }
);
