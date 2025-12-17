import { test, expect } from '../../../fixtures/commonFixture';
import { type Config, ConfigFactory } from '../../../env/config';
import DbAuditEvent from '../../../lib/aws/dynamoDB/DbAuditEventService';
import { questionnairesData } from '../../../testData/questionnairesTestData';
import DbHealthCheckService from '../../../lib/aws/dynamoDB/DbHealthCheckService';
import {
  ActivityCategory,
  AuditCategory,
  AuditEventType,
  BloodPressureCategory,
  BmiClassification,
  HealthCheckSteps,
  PatientResultsDetailedOpenedPage,
  QRiskCategory,
  type IQuestionnaireScores,
  type IRiskScores
} from '@dnhc-health-checks/shared';
import { healthyBiometricScores } from '../../../testData/biometricTestData';
import { HealthCheckBuilder } from '../../../testData/healthCheck/healthCheckBuilder';

const config: Config = ConfigFactory.getConfig();
const dbAuditEvent = new DbAuditEvent(config.name);
const dbHealthCheckService = new DbHealthCheckService(config.name);

const questionnaire = questionnairesData();
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

Object.values(AuditCategory).forEach((auditCategory: AuditCategory) => {
  let testStartDate: string;

  test(
    `Ensure user can view alcohol results for audit category ${auditCategory}`,
    {
      tag: ['@ui', '@results', '@regression']
    },
    async ({ resultsPages, page, testedUser }) => {
      testStartDate = new Date().toISOString();
      const questionnaireScores = {
        ...defaultQuestionnaireScores,
        auditCategory
      };

      const healthCheckToCreate = new HealthCheckBuilder(testedUser)
        .withStep(HealthCheckSteps.GP_UPDATE_SUCCESS)
        .withQuestionnaire(questionnaire)
        .withQuestionnaireScores(questionnaireScores)
        .withRiskScores(defaultRiskScores)
        .withBiometricScores(healthyBiometricScores())
        .build();
      await dbHealthCheckService.createHealthCheck(healthCheckToCreate);

      await page.goto(`${config.questionnaireAppURL}/alcohol-risk-results`);
      await resultsPages.alcoholResultsPage.waitUntilLoaded();
      let expectedRiskLevel;
      switch (auditCategory) {
        case AuditCategory.NoRisk:
        case AuditCategory.LowRisk:
          expectedRiskLevel = 'Low risk';
          break;
        case AuditCategory.IncreasingRisk:
          expectedRiskLevel = 'Increasing risk';
          break;
        case AuditCategory.HighRisk:
          expectedRiskLevel = 'High risk';
          break;
        case AuditCategory.PossibleDependency:
          expectedRiskLevel = 'Possible dependency';
          break;
      }
      expect(await resultsPages.alcoholResultsPage.geRiskLevel()).toEqual(
        expectedRiskLevel
      );

      const lastMessage =
        await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
          testedUser.nhsNumber,
          AuditEventType.PatientResultsDetailedOpened,
          testStartDate
        );
      expect(lastMessage).toBeTruthy();
      expect(lastMessage?.details?.page).toEqual(
        PatientResultsDetailedOpenedPage.Alcohol
      );
    }
  );
});
