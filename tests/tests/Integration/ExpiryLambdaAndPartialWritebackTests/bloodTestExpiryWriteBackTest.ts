import { test, expect } from '../../../fixtures/commonFixture';
import { type Config, ConfigFactory } from '../../../env/config';
import { type PatientItem } from '../../../lib/aws/dynamoDB/DbPatientService';
import { getPatientDbItem } from '../../../testData/patientTestData';
import { ScheduledReason } from '../../../lib/apiClients/HealthCheckModel';
import {
  healthyHealthCheckQuestionnaire,
  healthyHealthCheckQuestionnaireScores
} from '../../../testData/questionnairesTestData';
import { bloodTestExpiryWriteBackTestCases } from '../../../testData/bloodTestExpiryWritebackTestData';
import {
  BloodTestExpiryWritebackStatus,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
import { HealthCheckBuilder } from '../../../testData/healthCheck/healthCheckBuilder';

const config: Config = ConfigFactory.getConfig();

let testStartDate: string;
let healthCheckId: string;
let healthCheckToCreate: IHealthCheck;
let testedNhsNumber: string;
let testPatient: PatientItem;
const emisResultsBucket: string = 'emis-request-payload-bucket';

export default function bloodTestExpiryWriteBackTest(): void {
  bloodTestExpiryWriteBackTestCases().forEach(
    ({
      healthCheckStep,
      healthCheckCompletedDate,
      bloodTestExpiryStatus,
      expectedStatusChanges,
      description
    }) => {
      test.describe('Blood test expiry write-back integration test', () => {
        test.skip(
          config.autoExpiryEnabled !== true,
          'Only runs on environments with auto expiry enabled, set autoExpiryEnabled in test config and ENABLE_AUTO_EXPIRY in env config'
        );
        test.beforeEach(
          'Creating a health check item and schedule in Db',
          async ({ dbHealthCheckService, dbPatientService }) => {
            testedNhsNumber = '0000000108';
            testPatient = getPatientDbItem(testedNhsNumber);

            healthCheckToCreate = new HealthCheckBuilder(testPatient)
              .withBloodTestExpiryWritebackStatus(bloodTestExpiryStatus)
              .withStep(healthCheckStep)
              .withQuestionnaireCompletionDate(healthCheckCompletedDate)
              .withQuestionnaireScores(
                healthyHealthCheckQuestionnaireScores({
                  auditScore: 20
                })
              )
              .withQuestionnaire(
                healthyHealthCheckQuestionnaire({
                  bloodPressureDiastolic: 99
                })
              )
              .build();

            healthCheckId = healthCheckToCreate.id;
            await dbHealthCheckService.createHealthCheck(healthCheckToCreate);
            await dbPatientService.createPatient(testPatient);
          }
        );

        test.afterEach(
          'Deleting a health check and patient item from Db after tests',
          async ({
            dbHealthCheckService,
            dbPatientService,
            dbGpUpdateSchedulerService,
            s3Client
          }) => {
            await dbHealthCheckService.deleteItemById(healthCheckId);
            await dbGpUpdateSchedulerService.deleteGpUpdateSchedulerItemByHealthCheckId(
              healthCheckId
            );

            await dbPatientService.deletePatientItemByNhsNumber(
              testedNhsNumber
            );

            await s3Client.deleteObjectsFilteredByDate(
              emisResultsBucket,
              testStartDate,
              'IncompleteFileRecord/'
            );
          }
        );

        test(
          `Blood test expiry for test case - ${description}`,
          {
            tag: ['@emis', '@integration', '@partial-write-back']
          },
          async ({
            lambdaService,
            dbGpUpdateSchedulerService,
            dbHealthCheckService
          }) => {
            test.slow();
            testStartDate = new Date().toISOString();
            const response = await lambdaService.runLambdaWithParameters(
              `${config.name}NhcDataExpiryLambda`,
              {}
            );
            expect(response.$metadata.httpStatusCode).toEqual(200);

            await test.step('Check if schedule item exist in DB after running NhcDataExpiryLambda lambda', async () => {
              const scheduleList =
                await dbGpUpdateSchedulerService.getGpUpdateSchedulerItemsByHealthCheckId(
                  healthCheckId
                );

              if (expectedStatusChanges) {
                for (const schedule of scheduleList) {
                  expect(schedule.healthCheckId).toEqual(healthCheckId);
                  expect(schedule.scheduleReason).toEqual(
                    ScheduledReason.BloodResultOutstanding
                  );
                }
              } else {
                expect(scheduleList.length).toEqual(0);
              }
            });

            await test.step('Check bloodTestExpiryWritebackStatus after running NhcDataExpiryLambda lambda', async () => {
              const healthCheckItem =
                await dbHealthCheckService.getHealthCheckItemById(
                  healthCheckId
                );

              if (expectedStatusChanges) {
                expect(healthCheckItem.bloodTestExpiryWritebackStatus).toEqual(
                  BloodTestExpiryWritebackStatus.Scheduled
                );
              } else {
                expect(healthCheckItem.bloodTestExpiryWritebackStatus).toEqual(
                  bloodTestExpiryStatus
                );
              }
            });
          }
        );
      });
    }
  );
}
