import { test, expect } from '../../fixtures/commonFixture';
import { type Config, ConfigFactory } from '../../env/config';
import { type GpUpdateSchedulerItem } from '../../lib/aws/dynamoDB/DbGpUpdateSchedulerService';
import { v4 as uuidv4 } from 'uuid';
import {
  healthyHealthCheckQuestionnaire,
  healthyHealthCheckQuestionnaireScores
} from '../../testData/questionnairesTestData';
import {
  ActivityCategory,
  AuditEventType,
  HealthCheckSteps,
  LeicesterRiskCategory,
  QRiskCategory,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
import { getPatientDbItem } from '../../testData/patientTestData';
import { type PatientItem } from '../../lib/aws/dynamoDB/DbPatientService';
import { ScheduledReason } from '../../lib/apiClients/HealthCheckModel';
import { healthyBiometricScores } from '../../testData/biometricTestData';
import {
  BloodPressureLocation,
  ParentSiblingChildDiabetes,
  ParentSiblingHeartAttack,
  Smoking
} from '../../lib/enum/health-check-answers';
import { HealthCheckBuilder } from '../../testData/healthCheck/healthCheckBuilder';

const config: Config = ConfigFactory.getConfig();

let healthCheckId: string;
let testedNhsNumber: string;
let testPatient: PatientItem;
let healthCheckToCreate: IHealthCheck;
let gpUpdateSchedulerToCreate: GpUpdateSchedulerItem;

// Tests can be run only on env with mocked EMIS Api

test.describe(
  `ErrorDNHCNotWrittenToGp for incomplete write-back`,
  {
    tag: ['@manual']
  },
  () => {
    test.skip(
      config.emisMock === false,
      'Only runs on environments with Emis Mock Api deployed'
    );
    test.beforeEach(
      'Creating a health check and schedule items in Db',
      async ({
        dbAuditEvent,
        dbHealthCheckService,
        dbPatientService,
        dbGpUpdateSchedulerService
      }) => {
        testedNhsNumber = '0130000002';
        testPatient = getPatientDbItem(testedNhsNumber);

        healthCheckToCreate = new HealthCheckBuilder(testPatient)
          .withQuestionnaire(
            healthyHealthCheckQuestionnaire({
              bloodPressureDiastolic: 99
            })
          )
          .withQuestionnaireScores(
            healthyHealthCheckQuestionnaireScores({
              auditScore: 20
            })
          )
          .build();
        healthCheckId = healthCheckToCreate.id;

        gpUpdateSchedulerToCreate = {
          scheduleId: uuidv4(),
          createdAt: healthCheckToCreate.createdAt,
          healthCheckId,
          scheduleReason: ScheduledReason.UrgentDiabetes,
          status: 'New'
        };

        await dbAuditEvent.deleteItemByNhsNumber(testedNhsNumber);
        await dbHealthCheckService.createHealthCheck(healthCheckToCreate);
        await dbPatientService.createPatient(testPatient);
        await dbGpUpdateSchedulerService.createGpSchedulerItem(
          gpUpdateSchedulerToCreate
        );
      }
    );

    test.afterEach(
      'Deleting a health check and scheduler item from Db after tests',
      async ({
        dbHealthCheckService,
        dbAuditEvent,
        dbGpUpdateSchedulerService
      }) => {
        await dbHealthCheckService.deleteItemById(healthCheckId);
        await dbAuditEvent.deleteItemByNhsNumber(testedNhsNumber);
        await dbGpUpdateSchedulerService.deleteGpUpdateSchedulerItem(
          gpUpdateSchedulerToCreate.scheduleId
        );
      }
    );

    test(`ErrorDNHCNotWrittenToGp event for incomplete write-back`, async ({
      dbAuditEvent,
      nhcGpUpdateScheduleProcessorLambdaService
    }) => {
      test.setTimeout(200_000);
      const testStartDate = new Date().toISOString();
      const response =
        await nhcGpUpdateScheduleProcessorLambdaService.triggerLambda();
      expect(response.$metadata.httpStatusCode).toEqual(200);

      await test.step('Check if event ErrorDNHCNotWrittenToGp was created in DB', async () => {
        const lastMessage =
          await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
            testedNhsNumber,
            AuditEventType.ErrorDNHCNotWrittenToGp as unknown as string,
            testStartDate,
            20,
            10000
          );
        expect(lastMessage).toBeTruthy();
        expect(lastMessage?.details?.writebackType).toEqual('incomplete');
      });
    });
  }
);

test.describe(
  `ErrorDNHCNotWrittenToGp for complete write-back`,
  {
    tag: ['@manual']
  },
  () => {
    test.beforeEach(
      'Creating a health check and schedule items in Db',
      async ({ dbAuditEvent, dbHealthCheckService, dbPatientService }) => {
        testedNhsNumber = '0130000002';
        testPatient = getPatientDbItem(testedNhsNumber);

        healthCheckToCreate = new HealthCheckBuilder(testPatient)
          .withStep(HealthCheckSteps.LAB_RESULTS_RECEIVED)
          .withQuestionnaire({
            bloodPressureDiastolic: 90,
            bloodPressureSystolic: 160,
            bloodPressureLocation: BloodPressureLocation.Pharmacy,
            height: 190,
            weight: 100,
            waistMeasurement: 70,
            smoking: Smoking.Never,
            hasFamilyHeartAttackHistory: ParentSiblingHeartAttack.No,
            hasFamilyDiabetesHistory: ParentSiblingChildDiabetes.Yes
          })
          .withQuestionnaireScores({
            activityCategory: ActivityCategory.Active,
            auditScore: 37,
            bmiScore: 21,
            gppaqScore: 1,
            leicesterRiskCategory: LeicesterRiskCategory.Medium,
            leicesterRiskScore: 13,
            townsendScore: null
          })
          .withRiskScores({
            heartAge: 84,
            qRiskScore: 38.96,
            qRiskScoreCategory: QRiskCategory.High,
            scoreCalculationDate: '2024-07-09T12:41:52.690Z'
          })
          .withBiometricScores(healthyBiometricScores())
          .build();
        healthCheckToCreate.id = healthCheckId;

        await dbAuditEvent.deleteItemByNhsNumber(testedNhsNumber);
        await dbHealthCheckService.createHealthCheck(healthCheckToCreate);
        await dbPatientService.createPatient(testPatient);
      }
    );

    test.afterEach(
      'Deleting a health check item from Db after tests',
      async ({ dbHealthCheckService, dbAuditEvent }) => {
        await dbHealthCheckService.deleteItemById(healthCheckId);
        await dbAuditEvent.deleteItemByNhsNumber(testedNhsNumber);
      }
    );

    test(`ErrorDNHCNotWrittenToGp event for complete write-back`, async ({
      updatePatientRecordQueueClientService,
      dbAuditEvent
    }) => {
      test.setTimeout(200_000);
      const testStartDate = new Date().toISOString();
      const updatePatientRecordMessage = {
        patientGpOdsCode: 'mock_enabled_code',
        patientNhsNumber: testedNhsNumber,
        healthCheckId,
        correlationId: uuidv4()
      };
      await updatePatientRecordQueueClientService.sendMessage(
        updatePatientRecordMessage
      );

      await test.step('Check if event ErrorDNHCNotWrittenToGp was created in DB', async () => {
        const lastMessage =
          await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
            testedNhsNumber,
            AuditEventType.ErrorDNHCNotWrittenToGp as unknown as string,
            testStartDate,
            20,
            10000
          );
        expect(lastMessage).toBeTruthy();
        expect(lastMessage?.details?.writebackType).toEqual('complete');
      });
    });
  }
);
