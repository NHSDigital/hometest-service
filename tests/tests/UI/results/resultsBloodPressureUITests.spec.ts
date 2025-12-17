import { test, expect } from '../../../fixtures/commonFixture';
import { type Config, ConfigFactory } from '../../../env/config';
import DbAuditEvent from '../../../lib/aws/dynamoDB/DbAuditEventService';
import DbHealthCheckService from '../../../lib/aws/dynamoDB/DbHealthCheckService';
import { questionnairesData } from '../../../testData/questionnairesTestData';
import { RoutePath } from '../../../route-paths';
import {
  ActivityCategory,
  AuditEventType,
  BloodPressureCategory,
  BmiClassification,
  HealthCheckSteps,
  PatientResultsDetailedOpenedPage,
  QRiskCategory,
  type IQuestionnaireScores,
  type IRiskScores
} from '@dnhc-health-checks/shared';
import { AuditCategory } from '../../../lib/enum/health-check-answers';
import { healthyBiometricScores } from '../../../testData/biometricTestData';
import { type SessionItem } from '../../../lib/aws/dynamoDB/DbSessionService';
import { HealthCheckBuilder } from '../../../testData/healthCheck/healthCheckBuilder';

const config: Config = ConfigFactory.getConfig();
const dbAuditEvent = new DbAuditEvent(config.name);
const dbHealthCheckService = new DbHealthCheckService(config.name);
let sessionItem: SessionItem;

const questionnaire = questionnairesData();
const defaultQuestionnaireScores: IQuestionnaireScores = {
  activityCategory: ActivityCategory.ModeratelyActive,
  auditCategory: AuditCategory.NoRisk,
  auditScore: 0,
  bloodPressureCategory: BloodPressureCategory.SlightlyRaised,
  bmiClassification: BmiClassification.Overweight,
  bmiScore: 27.6,
  gppaqScore: 4
};

const defaultRiskScores: IRiskScores = {
  heartAge: 84,
  qRiskScore: 38.96,
  qRiskScoreCategory: QRiskCategory.High,
  scoreCalculationDate: '2024-08-13T09:04:53.804Z'
};

test.beforeAll(async ({ testedUser }) => {
  await dbAuditEvent.deleteItemByNhsNumber(testedUser.nhsNumber);
  await dbHealthCheckService.deleteItemByNhsNumber(testedUser.nhsNumber);
});
test.beforeEach(async ({ testedUser, dbSessionService }) => {
  sessionItem = await dbSessionService.getLatestSessionItemsByNhsNumber(
    testedUser.nhsNumber
  );
});

const bloodPressureCategoriesVisibleInUI = Object.values(
  BloodPressureCategory
).filter((category) => category !== BloodPressureCategory.VeryHigh);

const riskLevelDescriptions = {
  [BloodPressureCategory.Low]:
    'Your blood pressure reading is low. That’s usually not a problem, as it can be naturally low for some people. But sometimes it can be caused by illness, a health condition or some medicines.',
  [BloodPressureCategory.Healthy]: 'Your blood pressure reading is healthy.',
  [BloodPressureCategory.SlightlyRaised]:
    'Your blood pressure reading is slightly raised.',
  [BloodPressureCategory.High]:
    'This is high blood pressure. It can increase your risk of serious problems like heart attacks and strokes.'
};

function getRiskLevelDescription(
  bloodPressureCategory: BloodPressureCategory
): string {
  return riskLevelDescriptions[
    bloodPressureCategory as keyof typeof riskLevelDescriptions
  ];
}

const bloodPressureSystolics = [80, 120, 121, 169];
const bloodPressureDiastolics = [60, 60, 81, 99];

test.afterEach(
  'Deleting a health check and events items from Db after tests',
  async ({ testedUser }) => {
    await dbAuditEvent.deleteItemByNhsNumber(testedUser.nhsNumber);
    await dbHealthCheckService.deleteItemByNhsNumber(testedUser.nhsNumber);
  }
);

bloodPressureCategoriesVisibleInUI.forEach(
  (bloodPressureCategory: BloodPressureCategory, index) => {
    let testStartDate: string;

    const bloodPressureSystolic = bloodPressureSystolics[index];
    const bloodPressureDiastolic = bloodPressureDiastolics[index];
    test(
      `Ensure user can view blood pressure results for blood pressure category ${bloodPressureCategory}`,
      {
        tag: ['@ui', '@results', '@regression']
      },
      async ({ resultsPages, page, testedUser }) => {
        testStartDate = new Date().toISOString();
        const questionnaireScores = {
          ...defaultQuestionnaireScores,
          bloodPressureCategory
        };
        questionnaire.bloodPressureSystolic = bloodPressureSystolic;
        questionnaire.bloodPressureDiastolic = bloodPressureDiastolic;

        const healthCheckToCreate = new HealthCheckBuilder(testedUser)
          .withStep(HealthCheckSteps.GP_UPDATE_SUCCESS)
          .withQuestionnaire(questionnaire)
          .withQuestionnaireScores(questionnaireScores)
          .withRiskScores(defaultRiskScores)
          .withBiometricScores(healthyBiometricScores())
          .build();

        await dbHealthCheckService.createHealthCheck(healthCheckToCreate);

        await page.goto(
          `${config.questionnaireAppURL}${RoutePath.BloodPressureResultsPage}`
        );
        await resultsPages.bloodPressureResultsPage.waitUntilLoaded();
        await expect(
          resultsPages.bloodPressureResultsPage.getRiskLevel()
        ).toHaveText(
          `Your blood pressure is:${bloodPressureSystolic}/${bloodPressureDiastolic}`
        );

        if (bloodPressureCategory === BloodPressureCategory.High) {
          await expect(
            resultsPages.bloodPressureResultsPage.getHighRiskDescription()
          ).toHaveText(getRiskLevelDescription(bloodPressureCategory));
        } else {
          await expect(
            resultsPages.bloodPressureResultsPage.getRiskLevelDescription()
          ).toHaveText(getRiskLevelDescription(bloodPressureCategory));
        }

        const lastMessage =
          await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
            testedUser.nhsNumber,
            AuditEventType.PatientResultsDetailedOpened,
            testStartDate
          );
        expect(lastMessage).toBeTruthy();
        expect(lastMessage?.details?.page).toEqual(
          PatientResultsDetailedOpenedPage.BloodPressure
        );
        await resultsPages.bloodPressureResultsPage.clickBackLink();
        await resultsPages.mainResultsPage.waitUntilLoaded();
        expect(await resultsPages.mainResultsPage.getHeaderText()).toContain(
          `Hello ${sessionItem.firstName}, here are your results`
        );
      }
    );
  }
);
