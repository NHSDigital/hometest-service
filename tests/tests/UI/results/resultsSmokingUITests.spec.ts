import { test, expect } from '../../../fixtures/commonFixture';
import { type Config, ConfigFactory } from '../../../env/config';
import DbAuditEvent from '../../../lib/aws/dynamoDB/DbAuditEventService';
import { questionnairesData } from '../../../testData/questionnairesTestData';
import DbHealthCheckService from '../../../lib/aws/dynamoDB/DbHealthCheckService';
import {
  AuditCategory,
  Smoking,
  SmokingCategory,
  AuditEventType,
  PatientResultsDetailedOpenedPage,
  type IQuestionnaireScores,
  ActivityCategory,
  BloodPressureCategory,
  BmiClassification,
  type IRiskScores,
  QRiskCategory,
  HealthCheckSteps
} from '@dnhc-health-checks/shared';
import { healthyBiometricScores } from '../../../testData/biometricTestData';
import { HealthCheckBuilder } from '../../../testData/healthCheck/healthCheckBuilder';

const config: Config = ConfigFactory.getConfig();
const dbAuditEvent = new DbAuditEvent(config.name);
const dbHealthCheckService = new DbHealthCheckService(config.name);
const defaultQuestionnaire = questionnairesData();
const defaultQuestionnaireScores: IQuestionnaireScores = {
  activityCategory: ActivityCategory.ModeratelyActive,
  auditCategory: AuditCategory.NoRisk,
  auditScore: 0,
  bloodPressureCategory: BloodPressureCategory.High,
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

test.afterEach(
  'Deleting a health check and events items from Db after tests',
  async ({ testedUser }) => {
    await dbAuditEvent.deleteItemByNhsNumber(testedUser.nhsNumber);
    await dbHealthCheckService.deleteItemByNhsNumber(testedUser.nhsNumber);
  }
);

[
  {
    category: SmokingCategory.NeverSmoked,
    expectedRiskLevel: 'You have never smoked',
    smoking: Smoking.Never
  },
  {
    category: SmokingCategory.ExSmoker,
    expectedRiskLevel: 'You have already quit smoking',
    smoking: Smoking.Quitted
  },
  {
    category: SmokingCategory.CurrentSmoker,
    expectedRiskLevel: 'You smoke 1 to 9 cigarettes a day',
    smoking: Smoking.UpToNinePerDay
  },
  {
    category: SmokingCategory.CurrentSmoker,
    expectedRiskLevel: 'You smoke 10 to 19 cigarettes a day',
    smoking: Smoking.TenToNineteenPerDay
  },
  {
    category: SmokingCategory.CurrentSmoker,
    expectedRiskLevel: 'You smoke 20 or more cigarettes a day',
    smoking: Smoking.TwentyOrMorePerDay
  }
].forEach(({ category, expectedRiskLevel, smoking }) => {
  let testStartDate: string;

  test(
    `Ensure user can view smoke results for smoking questionnaire value ${smoking}`,
    {
      tag: ['@ui', '@results', '@regression']
    },
    async ({ resultsPages, page, testedUser }) => {
      testStartDate = new Date().toISOString();
      const questionnaireScores = {
        ...defaultQuestionnaireScores,
        smokingCategory: category
      };
      const questionnaire = {
        ...defaultQuestionnaire,
        smoking
      };

      const healthCheckToCreate = new HealthCheckBuilder(testedUser)
        .withStep(HealthCheckSteps.GP_UPDATE_SUCCESS)
        .withQuestionnaire(questionnaire)
        .withQuestionnaireScores(questionnaireScores)
        .withRiskScores(defaultRiskScores)
        .withBiometricScores(healthyBiometricScores())
        .build();

      await dbHealthCheckService.createHealthCheck(healthCheckToCreate);

      await page.goto(`${config.questionnaireAppURL}/smoking-results`);
      await resultsPages.smokingResultsPage.waitUntilLoaded();

      const actualRiskLevel = (
        await resultsPages.smokingResultsPage.getRiskLevel()
      ).toLowerCase();
      expect(actualRiskLevel).toEqual(expectedRiskLevel.toLowerCase());

      const lastMessage =
        await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
          testedUser.nhsNumber,
          AuditEventType.PatientResultsDetailedOpened,
          testStartDate
        );

      expect(lastMessage).toBeTruthy();
      expect(lastMessage?.details?.page).toEqual(
        PatientResultsDetailedOpenedPage.Smoking
      );
    }
  );
});
