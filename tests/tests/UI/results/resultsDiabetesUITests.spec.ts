import { test, expect } from '../../../fixtures/commonFixture';
import { type Config, ConfigFactory } from '../../../env/config';
import DbAuditEvent from '../../../lib/aws/dynamoDB/DbAuditEventService';
import { questionnairesData } from '../../../testData/questionnairesTestData';
import DbHealthCheckService from '../../../lib/aws/dynamoDB/DbHealthCheckService';
import {
  ActivityCategory,
  AuditEventType,
  BloodPressureCategory,
  DiabetesCategory,
  HealthCheckSteps,
  OverallDiabetesCategory,
  PatientResultsDetailedOpenedPage,
  QRiskCategory,
  type IQuestionnaireScores,
  type IRiskScores
} from '@dnhc-health-checks/shared';
import { RoutePath } from '../../../route-paths';
import { AuditCategory } from '../../../lib/enum/health-check-answers';
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
    expectedRiskLevel: 'Low',
    diabetes: {
      overallCategory: OverallDiabetesCategory.LowRiskNoBloodTest,
      category: DiabetesCategory.LowRiskNoBloodTest,
      hba1c: 0
    },
    expectedRiskDescription: 'You’re at low risk of developing type 2 diabetes.'
  },
  {
    expectedRiskLevel: 'Moderate',
    diabetes: {
      overallCategory: OverallDiabetesCategory.Low,
      category: DiabetesCategory.Low,
      hba1c: 41
    },
    expectedRiskDescription:
      'Your HbA1c blood test result is in the normal range (41 mmol/mol).'
  },
  {
    expectedRiskLevel: 'High',
    diabetes: {
      overallCategory: OverallDiabetesCategory.AtRisk,
      category: DiabetesCategory.AtRisk,
      hba1c: 45
    },
    expectedRiskDescription:
      'Your HbA1c blood test result is 45 mmol/mol. This suggests you’re at high risk of developing type 2 diabetes - this is known as prediabetes.'
  },
  {
    diabetes: {
      overallCategory: OverallDiabetesCategory.High,
      category: DiabetesCategory.High,
      hba1c: 49
    },
    expectedRiskLevel: 'Possible diabetes',
    expectedRiskDescription:
      'Your HbA1c blood test result is 49 mmol/mol. This suggests possible type 2 diabetes.'
  }
].forEach(({ diabetes, expectedRiskLevel, expectedRiskDescription }) => {
  let testStartDate: string;

  test(
    `Ensure user can view ${expectedRiskLevel} diabetes results and ${diabetes.category}`,
    {
      tag: ['@ui', '@results', '@regression']
    },
    async ({ resultsPages, page, testedUser }) => {
      testStartDate = new Date().toISOString();

      const questionnaireScores = {
        ...defaultQuestionnaireScores,
        riskLevel: expectedRiskLevel,
        riskDescription: expectedRiskDescription
      };

      const healthCheckToCreate = new HealthCheckBuilder(testedUser)
        .withStep(HealthCheckSteps.GP_UPDATE_SUCCESS)
        .withQuestionnaire(questionnaire)
        .withQuestionnaireScores(questionnaireScores)
        .withRiskScores(defaultRiskScores)
        .withBiometricScores(healthyBiometricScores(undefined, diabetes))
        .build();

      await dbHealthCheckService.createHealthCheck(healthCheckToCreate);

      await page.goto(
        `${config.questionnaireAppURL}${RoutePath.DiabetesRiskResultsPage}`
      );
      await resultsPages.diabetesResultsPage.waitUntilLoaded();

      const actualRiskLevel =
        await resultsPages.diabetesResultsPage.getRiskLevel();
      expect(actualRiskLevel).toBe(expectedRiskLevel);

      const actualRiskDescription =
        await resultsPages.diabetesResultsPage.getRiskDescription();
      expect(actualRiskDescription).toBe(expectedRiskDescription);

      const lastMessage =
        await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
          testedUser.nhsNumber,
          AuditEventType.PatientResultsDetailedOpened,
          testStartDate
        );
      expect(lastMessage).toBeTruthy();
      if (lastMessage) {
        expect(lastMessage.details?.page).toEqual(
          PatientResultsDetailedOpenedPage.Diabetes
        );
      }
    }
  );
});
