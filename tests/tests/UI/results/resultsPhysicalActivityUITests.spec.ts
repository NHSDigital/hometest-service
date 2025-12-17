import { questionnairesData } from '../../../testData/questionnairesTestData';
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
import { RoutePath } from '../../../route-paths';
import { test, expect } from '../../../fixtures/commonFixture';
import { healthyBiometricScores } from '../../../testData/biometricTestData';
import { type SessionItem } from '../../../lib/aws/dynamoDB/DbSessionService';
import { HealthCheckBuilder } from '../../../testData/healthCheck/healthCheckBuilder';

let sessionItem: SessionItem;
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

const riskLevelDescriptions = {
  [ActivityCategory.Active]:
    'This means that you exercise for more than 3 hours a week, or your job involves physical effort and handling of heavy objects or tools.',
  [ActivityCategory.ModeratelyActive]:
    'This means that you exercise for 1 to 3 hours each week, or your job involves standing.',
  [ActivityCategory.ModeratelyInactive]:
    'This means that you exercise for less than 1 hour each week, or your job involves mostly sitting.',
  [ActivityCategory.Inactive]:
    'This means that you do not exercise regularly or cycle, or your job involves mostly sitting.'
};

function getRiskLevelDescription(activityCategory: ActivityCategory): string {
  return riskLevelDescriptions[activityCategory];
}

test.beforeAll(async ({ testedUser, dbHealthCheckService, dbAuditEvent }) => {
  await dbAuditEvent.deleteItemByNhsNumber(testedUser.nhsNumber);
  await dbHealthCheckService.deleteItemByNhsNumber(testedUser.nhsNumber);
});
test.beforeEach(async ({ testedUser, dbSessionService }) => {
  sessionItem = await dbSessionService.getLatestSessionItemsByNhsNumber(
    testedUser.nhsNumber
  );
});
test.afterEach(
  'Deleting a health check and events items from Db after tests',
  async ({ testedUser, dbHealthCheckService, dbAuditEvent }) => {
    await dbAuditEvent.deleteItemByNhsNumber(testedUser.nhsNumber);
    await dbHealthCheckService.deleteItemByNhsNumber(testedUser.nhsNumber);
  }
);

Object.values(ActivityCategory).forEach(
  (activityCategory: ActivityCategory) => {
    let testStartDate: string;

    test(
      `Ensure user can view physical activity results for audit category ${activityCategory}`,
      {
        tag: ['@ui', '@results', '@regression']
      },
      async ({
        resultsPages,
        page,
        testedUser,
        config,
        dbAuditEvent,
        dbHealthCheckService
      }) => {
        testStartDate = new Date().toISOString();
        const questionnaireScores = {
          ...defaultQuestionnaireScores,
          activityCategory
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
          `${config.questionnaireAppURL}${RoutePath.PhysicalActivityResultsPage}`
        );
        await resultsPages.physicalActivityResultsPage.waitUntilLoaded();
        const riskLevel =
          await resultsPages.physicalActivityResultsPage.geRiskLevel();
        let expectedRiskLevel;
        switch (activityCategory) {
          case ActivityCategory.Active:
          case ActivityCategory.Inactive:
            expectedRiskLevel = activityCategory.toLowerCase();
            break;
          case ActivityCategory.ModeratelyActive:
            expectedRiskLevel = 'moderately active';
            break;
          case ActivityCategory.ModeratelyInactive:
            expectedRiskLevel = 'moderately inactive';
            break;
        }

        expect(riskLevel).toEqual(
          `Your physical activity level is ${expectedRiskLevel}`
        );
        const riskLevelDescription =
          await resultsPages.physicalActivityResultsPage.getRiskLevelDescription();
        expect(riskLevelDescription).toEqual(
          getRiskLevelDescription(activityCategory)
        );

        const lastMessage =
          await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
            testedUser.nhsNumber,
            AuditEventType.PatientResultsDetailedOpened,
            testStartDate
          );
        expect(lastMessage).toBeTruthy();
        expect(lastMessage?.details?.page).toEqual(
          PatientResultsDetailedOpenedPage.PhysicalActivity
        );
        await resultsPages.physicalActivityResultsPage.clickBackLink();
        await resultsPages.mainResultsPage.waitUntilLoaded();
        expect(await resultsPages.mainResultsPage.getHeaderText()).toContain(
          `Hello ${sessionItem.firstName}, here are your results`
        );
      }
    );
  }
);
