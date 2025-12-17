import { type Page } from '@playwright/test';
import { test, expect } from '../../fixtures/commonFixture';
import { PhysicalActivityResultsPage } from '../../page-objects/ResultsPages/PhysicalActivityResultsPage';
import { questionnairesData } from '../../testData/questionnairesTestData';
import { healthyBiometricScores } from '../../testData/biometricTestData';
import {
  ActivityCategory,
  BloodPressureCategory,
  BmiClassification,
  ExerciseHours,
  HealthCheckSteps,
  QRiskCategory,
  type IQuestionnaireScores,
  type IRiskScores
} from '@dnhc-health-checks/shared';
import AxeBuilder from '@axe-core/playwright';
import {
  createHtmlAccessibilityReport,
  tagList
} from '../../lib/AccessibilityTestReportHelper';
import { type HTCPage } from '../../page-objects/HTCPage';
import { RoutePath } from '../../route-paths';
import { AuditCategory } from '../../lib/enum/health-check-answers';
import { HealthCheckBuilder } from '../../testData/healthCheck/healthCheckBuilder';

let physicalActivityResultsPage: PhysicalActivityResultsPage;

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

const testCases = [
  {
    walkHours: ExerciseHours.None,
    activityCategory: ActivityCategory.Inactive
  },
  {
    walkHours: ExerciseHours.LessThanOne,
    activityCategory: ActivityCategory.Inactive
  },
  {
    walkHours: ExerciseHours.BetweenOneAndThree,
    activityCategory: ActivityCategory.Inactive
  },
  {
    walkHours: ExerciseHours.ThreeHoursOrMore,
    activityCategory: ActivityCategory.Inactive
  },
  {
    walkHours: ExerciseHours.None,
    activityCategory: ActivityCategory.ModeratelyInactive
  },
  {
    walkHours: ExerciseHours.LessThanOne,
    activityCategory: ActivityCategory.ModeratelyInactive
  },
  {
    walkHours: ExerciseHours.BetweenOneAndThree,
    activityCategory: ActivityCategory.ModeratelyInactive
  },
  {
    walkHours: ExerciseHours.ThreeHoursOrMore,
    activityCategory: ActivityCategory.ModeratelyInactive
  },
  {
    walkHours: ExerciseHours.ThreeHoursOrMore,
    activityCategory: ActivityCategory.ModeratelyActive
  },
  {
    walkHours: ExerciseHours.ThreeHoursOrMore,
    activityCategory: ActivityCategory.Active
  }
];

test.beforeAll(async ({ testedUser, dbAuditEvent, dbHealthCheckService }) => {
  await dbAuditEvent.deleteItemByNhsNumber(testedUser.nhsNumber);
  await dbHealthCheckService.deleteItemByNhsNumber(testedUser.nhsNumber);
});

test.beforeEach(({ page }) => {
  physicalActivityResultsPage = new PhysicalActivityResultsPage(page);
});

test.afterEach(
  'Deleting a health check and events items from Db after tests',
  async ({ testedUser, dbAuditEvent, dbHealthCheckService }) => {
    await dbAuditEvent.deleteItemByNhsNumber(testedUser.nhsNumber);
    await dbHealthCheckService.deleteItemByNhsNumber(testedUser.nhsNumber);
  }
);

testCases.forEach(({ walkHours, activityCategory }) => {
  test(`Results Accessibility tests for walkHours ${walkHours}, activityCategory ${activityCategory}`, async ({
    page,
    testedUser,
    config,
    dbHealthCheckService
  }) => {
    await test.step('Verify physical activity results page', async () => {
      questionnaire.walkHours = walkHours;
      defaultQuestionnaireScores.activityCategory = activityCategory;
      const healthCheckToCreate = new HealthCheckBuilder(testedUser)
        .withStep(HealthCheckSteps.GP_UPDATE_SUCCESS)
        .withQuestionnaire(questionnaire)
        .withQuestionnaireScores(defaultQuestionnaireScores)
        .withRiskScores(defaultRiskScores)
        .withBiometricScores(healthyBiometricScores())
        .build();
      await dbHealthCheckService.createHealthCheck(healthCheckToCreate);

      await page.goto(
        `${config.questionnaireAppURL}${RoutePath.PhysicalActivityResultsPage}`
      );
      await physicalActivityResultsPage.waitUntilLoaded();

      await verifyDetailedResultsPage(
        physicalActivityResultsPage,
        `PhysicalActivityResults-${activityCategory}-${walkHours}`,
        page
      );
    });
  }
  );
});

async function verifyDetailedResultsPage(
  detailedResultsPage: HTCPage,
  pageName: string,
  page: Page
): Promise<void> {
  await detailedResultsPage.waitUntilLoaded();

  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(tagList)
    .analyze();
  expect(
    await createHtmlAccessibilityReport(
      accessibilityScanResults,
      pageName,
      'Results',
      detailedResultsPage
    )
  ).toHaveLength(0);
}
