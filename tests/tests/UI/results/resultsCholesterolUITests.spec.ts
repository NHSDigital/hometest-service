import { test, expect } from '../../../fixtures/commonFixture';
import { type Config, ConfigFactory } from '../../../env/config';
import DbAuditEvent from '../../../lib/aws/dynamoDB/DbAuditEventService';
import DbHealthCheckService from '../../../lib/aws/dynamoDB/DbHealthCheckService';
import { questionnairesData } from '../../../testData/questionnairesTestData';
import {
  ActivityCategory,
  AuditEventType,
  BloodPressureCategory,
  BmiClassification,
  HdlCholesterolCategory,
  HealthCheckSteps,
  OverallCholesterolCategory,
  PatientResultsDetailedOpenedPage,
  QRiskCategory,
  TotalCholesterolCategory,
  TotalCholesterolHdlRatioCategory,
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
    cholesterol: {
      overallCategory: OverallCholesterolCategory.Normal,
      totalCholesterol: 2.9,
      totalCholesterolCategory: TotalCholesterolCategory.Normal,
      hdlCholesterol: 1.3,
      hdlCholesterolCategory: HdlCholesterolCategory.Normal,
      totalCholesterolHdlRatio: 3.7,
      totalCholesterolHdlRatioCategory: TotalCholesterolHdlRatioCategory.Normal
    },
    expectedCholesterolLevel: 'Healthy'
  },
  {
    cholesterol: {
      overallCategory: OverallCholesterolCategory.AtRisk,
      totalCholesterol: 2.9,
      totalCholesterolCategory: TotalCholesterolCategory.Normal,
      hdlCholesterol: 0.8,
      hdlCholesterolCategory: HdlCholesterolCategory.Low,
      totalCholesterolHdlRatio: 3.7,
      totalCholesterolHdlRatioCategory: TotalCholesterolHdlRatioCategory.Normal
    },
    expectedCholesterolLevel: 'At risk'
  },
  {
    cholesterol: {
      overallCategory: OverallCholesterolCategory.High,
      totalCholesterol: 6.5,
      totalCholesterolCategory: TotalCholesterolCategory.High,
      hdlCholesterol: 0.8,
      hdlCholesterolCategory: HdlCholesterolCategory.Low,
      totalCholesterolHdlRatio: 6.7,
      totalCholesterolHdlRatioCategory: TotalCholesterolHdlRatioCategory.High
    },
    expectedCholesterolLevel: 'High risk'
  },
  {
    cholesterol: {
      overallCategory: OverallCholesterolCategory.VeryHigh,
      totalCholesterol: 7.5,
      totalCholesterolCategory: TotalCholesterolCategory.VeryHigh,
      hdlCholesterol: 0.8,
      hdlCholesterolCategory: HdlCholesterolCategory.Low,
      totalCholesterolHdlRatio: 6.7,
      totalCholesterolHdlRatioCategory: TotalCholesterolHdlRatioCategory.High
    },
    expectedCholesterolLevel: 'Very high risk'
  }
].forEach(({ cholesterol, expectedCholesterolLevel }) => {
  let testStartDate: string;
  test(
    `Ensure user can view ${expectedCholesterolLevel} cholesterol results for cholesterol category ${cholesterol.overallCategory}`,
    {
      tag: ['@ui', '@results', '@regression']
    },
    async ({ resultsPages, page, testedUser }) => {
      testStartDate = new Date().toISOString();

      const healthCheckToCreate = new HealthCheckBuilder(testedUser)
        .withStep(HealthCheckSteps.GP_UPDATE_SUCCESS)
        .withQuestionnaire(questionnaire)
        .withQuestionnaireScores(defaultQuestionnaireScores)
        .withRiskScores(defaultRiskScores)
        .withBiometricScores(healthyBiometricScores(cholesterol))
        .build();

      await dbHealthCheckService.createHealthCheck(healthCheckToCreate);
      await page.goto(
        `${config.questionnaireAppURL}${RoutePath.CholesterolResultsPage}`
      );
      await resultsPages.cholesterolResultsPage.waitUntilLoaded();

      const actualRiskLevel =
        await resultsPages.cholesterolResultsPage.getRiskLevel();
      expect(actualRiskLevel).toBe(expectedCholesterolLevel);

      const lastMessage =
        await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
          testedUser.nhsNumber,
          AuditEventType.PatientResultsDetailedOpened,
          testStartDate
        );

      expect(lastMessage).toBeTruthy();
      expect(lastMessage?.details?.page).toEqual(
        PatientResultsDetailedOpenedPage.Cholesterol
      );
    }
  );
});
