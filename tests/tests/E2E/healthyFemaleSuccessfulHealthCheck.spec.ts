import { test, expect } from '../../fixtures/commonFixture';
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
import NhsLoginHelper from '../../page-objects/NhsLoginHelper';
import {
  checkPdmCloudWatchForLogs,
  cleanupE2EUserData,
  initializeEmailHelper
} from './E2ECommonMethods';
import { type GpEmailTestHelper } from '../../lib/email/GpEmailTestHelper';
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
import { SpecialUserKey } from '../../lib/users/SpecialUserKey';
import type { BaseTestUser, NHSLoginUser } from '../../lib/users/BaseUser';

let userUnderTest: BaseTestUser;
let healthCheck: IHealthCheck;
let gpEmailHelper: GpEmailTestHelper;

test.beforeEach(
  'Cleanup health check',
  async ({
    dbHealthCheckService,
    dbAuditEvent,
    dbLabOrderService,
    dbLabResultService,
    config,
    context,
    userManager,
    dbMnsCommunicationLogService,
    testedUser
  }) => {
    if (!config.integratedEnvironment) {
      userUnderTest = testedUser;
      console.log(userUnderTest);
    } else {
      await context.clearCookies();
      userUnderTest = userManager.getSpecialUser(
        SpecialUserKey.ELIGIBLE_E2E_DEDICATED_USER
      );
    }
    gpEmailHelper = initializeEmailHelper(config, userUnderTest.nhsNumber);
    await gpEmailHelper.setupGpEmailTest();

    await cleanupE2EUserData(
      dbLabOrderService,
      dbLabResultService,
      dbHealthCheckService,
      dbAuditEvent,
      dbMnsCommunicationLogService,
      userUnderTest
    );
  }
);

test.afterEach(
  'Deleting a health check, lab order and lab results after tests',
  async ({
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
      userUnderTest
    );
    await gpEmailHelper.cleanupGpEmailTest(false);
  }
);

test(
  'E2E - Healthy female successful health check',
  {
    tag: ['@ui', '@e2e', '@regression']
  },
  async ({
    nhsLoginPages,
    completeHealthCheckFirstPage,
    termsAndConditionsPage,
    bloodPressurePages,
    submitAndReviewPages,
    bloodTestPages,
    taskListPage,
    dbHealthCheckService,
    resultsPages,
    dbPatientService,
    dbLabOrderService,
    config,
    page,
    labResultsApiResource,
    pdmCloudWatchService,
    dbMnsCommunicationLogService
  }) => {
    test.setTimeout(240000);

    if (config.integratedEnvironment) {
      await test.step('User logs in', async () => {
        await nhsLoginPages.nhsFirstPage.goToTheQuestionnaireAppUrlAndClickContinue();
        await nhsLoginPages.nhsAppRedirectorPage.waitUntilLoadedAndClickContinue();
        await new NhsLoginHelper().fillNhsLoginFormsAndWaitForNextPage(
          userUnderTest as NHSLoginUser,
          page
        );
      });
    }

    await test.step('Start health check and accept terms and conditions', async () => {
      if (!config.integratedEnvironment) {
        await completeHealthCheckFirstPage.goToCompleteHealthCheckFirstPageAndWaitForLoading();
      }
      await completeHealthCheckFirstPage.waitUntilLoaded();
      await completeHealthCheckFirstPage.clickStartNowBtn();
      await termsAndConditionsPage.waitUntilLoaded();
      await termsAndConditionsPage.checkAcceptTermsBoxAndClickAcceptAndContinueButton();
      await gpEmailHelper.setupGpEmailTest();
    });

    await test.step('Confirm eligibility and read declaraton', async () => {
      const data = new EligibilitySectionDataFactory(
        EligibilitySectionDataType.ELIGIBLE_USER
      ).getData();
      await new EligibilitySectionFlow(data, page).completeSection();
      await taskListPage.waitUntilLoaded();
    });

    await test.step('Complete about you section', async () => {
      const data = new AboutYouSectionDataFactory(
        AboutYouSectionDataType.NON_SMOKING_HEALTHY_WHITE_FEMALE
      ).getData();
      await new AboutYouSectionFlow(data, page, false).completeSection();
    });

    await test.step('Complete physical activity section', async () => {
      const data = new PhysicalActivitySectionDataFactory(
        PhysicalActivitySectionDataType.WITHOUT_OPTIONALS
      ).getData();
      await new PhysicalActivitySectionFlow(data, page).completeSection();
    });

    await test.step('Complete alcohol consumption section', async () => {
      const data = new AlcoholConsumptionSectionDataFactory(
        AlcoholConsumptionSectionDataType.NO_DRINKING
      ).getData();
      await new AlcoholConsumptionSectionFlow(data, page).completeSection();
    });

    await test.step('Complete body measurements section', async () => {
      const data = new BodyMeasurementsSectionDataFactory(
        BodyMeasurementsSectionDataType.HEALTHY_BMI
      ).getData();
      await new BodyMeasurementsSectionFlow(data, page).completeSection();
    });

    await test.step('Complete blood pressure section', async () => {
      await taskListPage.clickCheckYourPressureLink();
      await bloodPressurePages.checkBloodPressurePage.waitUntilLoaded();
      await bloodPressurePages.checkBloodPressurePage.clickContinueButton();
      await bloodPressurePages.confirmBloodPressureLocationPage.waitUntilLoaded();
      await bloodPressurePages.confirmBloodPressureLocationPage.selectBloodPressureOptionsAndClickContinue(
        BloodPressureLocation.Monitor
      );
      await bloodPressurePages.enterYourReadingPage.waitUntilLoaded();
      await bloodPressurePages.enterYourReadingPage.fillSystolicAndDiastolicValuesAndClickContinue(
        120,
        80
      );
      await bloodPressurePages.checkYourAnswersPage.waitUntilLoaded();
      await bloodPressurePages.checkYourAnswersPage.clickSaveAndContinueButton();
      await taskListPage.waitUntilLoaded();
    });

    await test.step('Review and submit the answers', async () => {
      await taskListPage.clickReviewAndSubmitLink();
      await submitAndReviewPages.checkYourAnswersReviewSubmitPage.waitUntilLoaded();
      await submitAndReviewPages.checkYourAnswersReviewSubmitPage.clickSubmitButton();

      await bloodTestPages.orderBloodTestKitPage.waitUntilLoaded();
    });

    await test.step('Check that health check status is update to questionnaire completed', async () => {
      healthCheck =
        (await dbHealthCheckService.getLatestHealthCheckItemsByNhsNumber(
          userUnderTest.nhsNumber
        )) as IHealthCheck;
      expect(
        healthCheck !== undefined,
        'Health check was not found'
      ).toBeTruthy();
      if (healthCheck !== undefined) {
        await dbHealthCheckService.waitForHealthCheckStepStatusToBeUpdatedByHealthCheckId(
          healthCheck.id,
          HealthCheckSteps.QUESTIONNAIRE_COMPLETED
        );
      }
    });

    await test.step('Order blood test kit', async () => {
      if (config.integratedEnvironment) {
        await dbPatientService.updatePatientOdsCode(
          userUnderTest.nhsNumber,
          patientOdsCodeForThrivaIntegration
        );
      }

      await bloodTestPages.orderBloodTestKitPage.clickContinueButton();
      await bloodTestPages.findDeliveryAddressPage.waitUntilLoaded();
      await bloodTestPages.findDeliveryAddressPage.fillPostcodeField('FY83SY');
      await bloodTestPages.findDeliveryAddressPage.clickContinueButton();
      await bloodTestPages.selectDeliveryAddressPage.waitUntilLoaded();
      await bloodTestPages.selectDeliveryAddressPage.selectAddress('1');
      await bloodTestPages.selectDeliveryAddressPage.clickContinueButton();
      await bloodTestPages.enterPhoneNumberPage.waitUntilLoaded();
      await bloodTestPages.enterPhoneNumberPage.clickContinueButton();
      await bloodTestPages.confirmDetailsPage.waitUntilLoaded();
      await bloodTestPages.confirmDetailsPage.clickSaveAndContinueButton();
      await bloodTestPages.bloodTestOrderedPage.waitUntilLoaded();
    });

    if (!config.integratedEnvironment) {
      await test.step('Simulate Thriva response to results API', async () => {
        const labOrders = await dbLabOrderService.getLabOrderByHealthCheckId(
          healthCheck.id
        );
        if (labOrders === undefined || labOrders.length === 0) {
          throw new Error('Lab Order was not found');
        }
        const labResult = getLabResults(
          LabResultsData.NewModelSucessCholesterolOnly
        );
        const labResultApiRequestBody = {
          orderId: 'TEST87654323',
          orderExternalReference: labOrders[0].id,
          resultData: labResult,
          resultDate: new Date().toISOString(),
          pendingReorder: false
        };
        const response = await labResultsApiResource.sendLabResults(
          labResultApiRequestBody
        );
        expect(response.status()).toBe(201);
      });
    }

    await test.step('Wait for Thriva to send the results', async () => {
      test.setTimeout(600000);
      // Wait max 6 minutes calling for results every 10 seconds
      const areThrivaResultsRetrieved =
        await dbHealthCheckService.waitForKeyToBePresentByHealthCheckId(
          healthCheck.id,
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
          healthCheck.id,
          HealthCheckSteps.GP_UPDATE_SUCCESS,
          15,
          3000
        );
      expect(
        isHealthCheckStepUpdated,
        'The HealthCheck step was not updated by EMIS service'
      ).toBeTruthy();
    });

    await test.step('Check that user is on the results page', async () => {
      await resultsPages.mainResultsPage.goToMainResultsPageAndWaitForLoading();
      await resultsPages.mainResultsPage.waitUntilLoaded();
    });

    await test.step('Check PDM CloudWatch logs', async () => {
      await checkPdmCloudWatchForLogs(healthCheck.id, pdmCloudWatchService);
    });

    await test.step('Check that email has been sent to GP', async () => {
      await gpEmailHelper.verifyEmailHasBeenSent();
    });

    if (config.mnsIntegrationEnabled) {
      await test.step('Check MNS outbound message sent', async () => {
        const mnsMessageLog =
          await dbMnsCommunicationLogService.waitForItemByHealthCheckId(
            healthCheck.id
          );
        expect(
          mnsMessageLog.nhsNumber,
          'MNS message NHS number does not match'
        ).toBe(userUnderTest.nhsNumber);
        expect(mnsMessageLog.status, 'MNS message status is not SENT').toBe(
          MnsMessageStatus.SENT
        );
      });
    }
  }
);
