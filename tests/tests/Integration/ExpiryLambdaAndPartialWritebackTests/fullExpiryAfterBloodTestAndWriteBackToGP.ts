import { test, expect } from '../../../fixtures/commonFixture';
import { type Config, ConfigFactory } from '../../../env/config';
import { v4 as uuidv4 } from 'uuid';
import { type PatientItem } from '../../../lib/aws/dynamoDB/DbPatientService';
import {
  getPatientDbItem,
  getRandomNhsNumber
} from '../../../testData/patientTestData';
import { generateStringDateWithChangedDays } from '../../../testData/bloodTestExpiryWritebackTestData';
import { getOdsCodeData, type OdsItem } from '../../../testData/odsCodeData';
import {
  AutoExpiryStatus,
  HealthCheckSteps,
  LabTestType,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
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
const healthCheckExpectedStatus = 'AUTO_EXPIRED_NO_BLOOD_FINAL';

export default function fullyExpiryAfterBloodTestOrderAndWriteBackTest(): void {
  test.describe('Fully expire HC 365 days after blood test ordered', () => {
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
          .withCreatedAt(generateStringDateWithChangedDays(-366))
          .withExpiredAt(new Date().toISOString())
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
          createdAt: generateStringDateWithChangedDays(-366),
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

        for (const folderName of ['IncompleteFileRecord/', 'FileRecord/']) {
          await s3Client.deleteObjectsFilteredByDate(
            emisResultsBucket,
            testStartDate,
            folderName
          );
        }
      }
    );

    test(
      `Fully expire HC 365 days after blood test ordered`,
      {
        tag: ['@integration', '@emis', '@autoExpiry']
      },
      async ({
        expiryLambdaService,
        dbHealthCheckService,
        dbLabOrderService
      }) => {
        test.slow();
        testStartDate = new Date().toISOString();

        await test.step('Run expiry lambda', async () => {
          const response = await expiryLambdaService.triggerLambda();
          expect(
            response.$metadata.httpStatusCode,
            'Expiry lambda trigger failed'
          ).toEqual(200);
        });

        await test.step('Check if healthCheck expiryStatus was updated to AUTO_EXPIRED_NO_BLOOD_FINAL and step to COMPLETE', async () => {
          const healthCheckItem =
            await dbHealthCheckService.getHealthCheckItemById(healthCheckId);

          expect(healthCheckItem.expiryStatus).toEqual('COMPLETE');
          expect(healthCheckItem.step).toEqual(healthCheckExpectedStatus);
        });

        await test.step('Check if lab order was removed from database after running NhcDataExpiryLambda lambda', async () => {
          const response = await expiryLambdaService.triggerLambda();
          expect(
            response.$metadata.httpStatusCode,
            'Expiry lambda trigger failed'
          ).toEqual(200);

          const dbLabOrderItem =
            await dbLabOrderService.getLabOrderByHealthCheckId(healthCheckId);

          expect(dbLabOrderItem.length).toEqual(0);
        });
      }
    );
  });
}
