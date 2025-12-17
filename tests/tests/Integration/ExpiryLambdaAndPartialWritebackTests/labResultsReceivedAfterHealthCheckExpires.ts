import { test, expect } from '../../../fixtures/commonFixture';
import { type Config, ConfigFactory } from '../../../env/config';
import { v4 as uuidv4 } from 'uuid';
import { type PatientItem } from '../../../lib/aws/dynamoDB/DbPatientService';
import {
  getPatientDbItem,
  getRandomNhsNumber
} from '../../../testData/patientTestData';
import {
  AuditEventType,
  AutoExpiryStatus,
  HealthCheckSteps,
  LabTestType,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
import { generateStringDateWithChangedDays } from '../../../testData/bloodTestExpiryWritebackTestData';
import { getOdsCodeData, type OdsItem } from '../../../testData/odsCodeData';
import {
  getLabResults,
  LabResultsData
} from '../../../testData/labResultsTestData';
import { HealthCheckBuilder } from '../../../testData/healthCheck/healthCheckBuilder';

let testStartDate: string;
let healthCheckId: string;
let labOrderId: string;
let healthCheckToCreate: IHealthCheck;
let testedNhsNumber: string;
let testPatient: PatientItem;
let ruleNames: string[];
let odsCodeItem: OdsItem;
const emisResultsBucket: string = 'emis-request-payload-bucket';
const config: Config = ConfigFactory.getConfig();

export default function labResultsReceivedAfterHealthCheckExpires(): void {
  test.describe('Expire health check test', () => {
    test.skip(
      config.autoExpiryEnabled !== true || config.emisMock === false,
      'Only runs on environments with auto expiry enabled, set autoExpiryEnabled in test config and ENABLE_AUTO_EXPIRY in env config and with EMIS mock'
    );
    test.beforeEach(
      'Creating a health check item and schedule in Db',
      async ({
        eventBridgeService,
        dbHealthCheckService,
        dbPatientService,
        dbOdsCodeService,
        dbLabOrderService
      }) => {
        ruleNames = [
          await eventBridgeService.getRuleName('nhc-gp-partial'),
          await eventBridgeService.getRuleName('nhc-expired')
        ];
        await Promise.all(
          ruleNames.map(async (ruleName) => {
            await eventBridgeService.disableEventBridgeRule(ruleName);
          })
        );

        testedNhsNumber = getRandomNhsNumber();
        odsCodeItem = getOdsCodeData();
        testPatient = getPatientDbItem(
          testedNhsNumber,
          uuidv4(),
          odsCodeItem.gpOdsCode
        );

        healthCheckToCreate = new HealthCheckBuilder(testPatient)
          .withCreatedAt(generateStringDateWithChangedDays(-92))
          .withExpiryStatus(AutoExpiryStatus.COMPLETE)
          .withStep(HealthCheckSteps.AUTO_EXPIRED_BLOOD_ORDERED)
          .withResultTypes([LabTestType.Cholesterol])
          .build();

        healthCheckId = healthCheckToCreate.id;
        await dbHealthCheckService.createHealthCheck(healthCheckToCreate);
        await dbOdsCodeService.createGpOdsCodeItem(odsCodeItem);
        await dbPatientService.createPatient(testPatient);

        labOrderId = uuidv4();
        await dbLabOrderService.createLabOrder({
          id: labOrderId,
          healthCheckId,
          createdAt: generateStringDateWithChangedDays(-92),
          testTypes: [LabTestType.Cholesterol],
          deliveryAddress: { addressLine1: 'addr1', postcode: 'postcode' }
        });
      }
    );

    test.afterEach(
      'Deleting a health check and patient item from Db after tests',
      async ({
        eventBridgeService,
        dbHealthCheckService,
        dbPatientService,
        dbGpUpdateSchedulerService,
        dbLabOrderService,
        dbOdsCodeService,
        s3Client
      }) => {
        await Promise.all(
          ruleNames.map(async (ruleName) => {
            await eventBridgeService.enableEventBridgeRule(ruleName);
          })
        );
        await dbHealthCheckService.deleteItemById(healthCheckId);
        await dbGpUpdateSchedulerService.deleteGpUpdateSchedulerItemByHealthCheckId(
          healthCheckId
        );
        await dbPatientService.deletePatientItemByNhsNumber(testedNhsNumber);
        await dbLabOrderService.deleteLabOrderItem(labOrderId);
        await dbOdsCodeService.deleteGpOdsCodeItem(odsCodeItem.gpOdsCode);

        await s3Client.deleteObjectsFilteredByDate(
          emisResultsBucket,
          testStartDate,
          'IncompleteFileRecord/'
        );
      }
    );

    test(
      `Lab resulst are received after health check expires`,
      {
        tag: ['@integration', '@emis', '@autoExpiry', '@partial-write-back']
      },
      async ({
        expiryLambdaService,
        nhcGpUpdateScheduleProcessorLambdaService,
        dbGpUpdateSchedulerService,
        dbHealthCheckService,
        dbAuditEvent,
        dbLabOrderService,
        dbLabResultService,
        labResultsApiResource
      }) => {
        test.slow();
        testStartDate = new Date().toISOString();

        await test.step('Mock Thriva sending results', async () => {
          const labResult = getLabResults(
            LabResultsData.NewModelSucessCholesterolOnly
          );
          const labResultApiRequestBody = {
            orderId: 'TEST87654329',
            orderExternalReference: labOrderId,
            resultData: labResult,
            pendingReorder: false,
            resultDate: new Date().toISOString()
          };
          const response = await labResultsApiResource.sendLabResults(
            labResultApiRequestBody
          );
          expect(response.status()).toBe(201);
        });

        await test.step('Verify health check step is AUTO_EXPIRED_BLOOD_RECEIVED', async () => {
          await dbHealthCheckService.waitForHealthCheckStepStatusToBeUpdatedByHealthCheckId(
            healthCheckId,
            HealthCheckSteps.AUTO_EXPIRED_BLOOD_RECEIVED
          );
        });

        await test.step('Run expiry lambda', async () => {
          const response = await expiryLambdaService.triggerLambda();
          expect(
            response.$metadata.httpStatusCode,
            'Expiry lambda trigger failed'
          ).toEqual(200);
        });

        await test.step('Check if healthCheck expiryStatus ans step were updated in DB after running NhcDataExpiryLambda lambda', async () => {
          const healthCheckItem =
            await dbHealthCheckService.getHealthCheckItemById(healthCheckId);

          expect(healthCheckItem.expiryStatus).toEqual(
            'GP_PARTIAL_UPDATE_SCHEDULED'
          );
          expect(healthCheckItem.step).toEqual(
            HealthCheckSteps.AUTO_EXPIRED_BLOOD_FINAL
          );
        });

        await test.step('Check if GpScheduler with scheduledReason expiryNoBloodResultFinal was created', async () => {
          const gpUpdateSchedulerItems =
            await dbGpUpdateSchedulerService.getGpUpdateSchedulerItemsByHealthCheckId(
              healthCheckId
            );
          expect(gpUpdateSchedulerItems[0].scheduleReason).toEqual(
            'expiryBloodResultReceivedFinal'
          );

          const response =
            await nhcGpUpdateScheduleProcessorLambdaService.triggerLambda();
          expect(response.$metadata.httpStatusCode).toEqual(200);
        });

        await test.step('Check if BloodResultWrittenToGP audit event with expiryNoBloodResultFinal reason was created', async () => {
          const BloodResultWrittenToGpMessage =
            await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
              healthCheckToCreate.nhsNumber as unknown as string,
              AuditEventType.BloodResultWrittenToGP,
              testStartDate
            );
          expect(BloodResultWrittenToGpMessage?.details?.followUp).toEqual(
            'yes'
          );

          const allAuditEvents =
            await dbAuditEvent.getAllAuditEventItemsByNhsNumberAndFilterByDatetime(
              healthCheckToCreate.nhsNumber as unknown as string,
              testStartDate
            );
          allAuditEvents.map((auditEventItem) => {
            expect(auditEventItem?.eventType).not.toEqual(
              AuditEventType.IncompleteDNHCWrittenToGp
            );
          });
        });

        await test.step('Check if healthCheck expiryStatus was updated to AUTO_EXPIRED_BLOOD_FINAL and step to COMPLETE after running NhcDataExpiryLambda lambda', async () => {
          const response = await expiryLambdaService.triggerLambda();
          expect(
            response.$metadata.httpStatusCode,
            'Expiry lambda trigger failed'
          ).toEqual(200);

          const healthCheckItem =
            await dbHealthCheckService.getHealthCheckItemById(healthCheckId);

          expect(healthCheckItem.expiryStatus).toEqual('COMPLETE');
          expect(healthCheckItem.step).toEqual(
            HealthCheckSteps.AUTO_EXPIRED_BLOOD_FINAL
          );
        });

        await test.step('Check that lab order was removed from database', async () => {
          const dbLabOrderItem =
            await dbLabOrderService.getLabOrderByHealthCheckId(healthCheckId);

          expect(
            dbLabOrderItem.length,
            'Lab order was not removed after expiry lambda runs'
          ).toEqual(0);
        });

        await test.step('Check that lab results got removed', async () => {
          const labResults =
            await dbLabResultService.getLabResultByHealthCheckId(healthCheckId);
          expect(
            labResults.length,
            'Lab results were not removed after expiry lambda runs'
          ).toBe(0);
        });
      }
    );
  });
}
