import { test, expect } from '../../../fixtures/commonFixture';
import { type Config, ConfigFactory } from '../../../env/config';
import DbAuditEvent from '../../../lib/aws/dynamoDB/DbAuditEventService';
import { questionnairesData } from '../../../testData/questionnairesTestData';
import DbHealthCheckService from '../../../lib/aws/dynamoDB/DbHealthCheckService';
import {
  AuditEventType,
  AuditCategory,
  BmiClassification,
  PatientResultsDetailedOpenedPage,
  type IQuestionnaireScores,
  ActivityCategory,
  BloodPressureCategory,
  type IRiskScores,
  QRiskCategory,
  HealthCheckSteps
} from '@dnhc-health-checks/shared';
import { RoutePath } from '../../../route-paths';
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

const BmiDescription = {
  Underweight:
    'Your BMI is in the underweight category. This suggests you could benefit from gaining weight.',
  Healthy: 'Your BMI is in the healthy weight category.',
  Overweight:
    'Your BMI is in the overweight category. This suggests you could benefit from making some healthy changes.',
  Obese:
    'Your BMI is in the obesity category. This suggests you are carrying too much weight and you would benefit from making some healthy changes.'
};

[
  {
    category: BmiClassification.Underweight,
    expectedBmiDescription: BmiDescription.Underweight,
    expectedBmiScore: 18.4
  },
  {
    category: BmiClassification.Healthy,
    expectedBmiDescription: BmiDescription.Healthy,
    expectedBmiScore: 22.4
  },
  {
    category: BmiClassification.Overweight,
    expectedBmiDescription: BmiDescription.Overweight,
    expectedBmiScore: 27.4
  },
  {
    category: BmiClassification.Obese1,
    expectedBmiDescription: BmiDescription.Obese,
    expectedBmiScore: 32.4
  },
  {
    category: BmiClassification.Obese2,
    expectedBmiDescription: BmiDescription.Obese,
    expectedBmiScore: 37.4
  },
  {
    category: BmiClassification.Obese3,
    expectedBmiDescription: BmiDescription.Obese,
    expectedBmiScore: 42.4
  }
].forEach(({ category, expectedBmiDescription, expectedBmiScore }) => {
  let testStartDate: string;

  test(
    `Ensure user can view BMI results for BMI questionnaire value of ${expectedBmiScore} in category ${category}`,
    {
      tag: ['@ui', '@results', '@regression']
    },
    async ({ resultsPages, page, testedUser }) => {
      testStartDate = new Date().toISOString();

      const questionnaireScores = {
        ...defaultQuestionnaireScores,
        bmiClassification: category,
        bmiScore: expectedBmiScore
      };

      const healthCheckToCreate = new HealthCheckBuilder(testedUser)
        .withStep(HealthCheckSteps.GP_UPDATE_SUCCESS)
        .withQuestionnaire(questionnaire)
        .withQuestionnaireScores(questionnaireScores)
        .withRiskScores(defaultRiskScores)
        .withBiometricScores(healthyBiometricScores())
        .build();
      await dbHealthCheckService.createHealthCheck(healthCheckToCreate);

      await page.goto(
        `${config.questionnaireAppURL}${RoutePath.BMIResultsPage}`
      );
      await resultsPages.bmiResultsPage.waitUntilLoaded();

      const actualBmiScore = await resultsPages.bmiResultsPage.getBmiScore();
      expect(Number(actualBmiScore)).toEqual(expectedBmiScore);

      const actualBmiDescription =
        await resultsPages.bmiResultsPage.getBmiCategoryText();
      expect(actualBmiDescription).toEqual(expectedBmiDescription.toString());

      const lastMessage =
        await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
          testedUser.nhsNumber,
          AuditEventType.PatientResultsDetailedOpened,
          testStartDate
        );
      expect(lastMessage).toBeTruthy();
      expect(lastMessage?.details?.page).toEqual(
        PatientResultsDetailedOpenedPage.BMI
      );
    }
  );
});
