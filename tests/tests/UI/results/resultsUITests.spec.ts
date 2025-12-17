import { test, expect } from '../../../fixtures/commonFixture';
import { type MainResultsPage } from '../../../page-objects/ResultsPages/MainResultsPage';
import { type Config, ConfigFactory } from '../../../env/config';
import { type HTCPage } from '../../../page-objects/HTCPage';
import DbAuditEvent from '../../../lib/aws/dynamoDB/DbAuditEventService';
import { questionnairesData } from '../../../testData/questionnairesTestData';
import DbHealthCheckService from '../../../lib/aws/dynamoDB/DbHealthCheckService';
import {
  HdlCholesterolCategory,
  TotalCholesterolCategory,
  ActivityCategory,
  AuditEventType,
  BloodPressureCategory,
  BmiClassification,
  OverallCholesterolCategory,
  PatientResultsDetailedOpenedPage,
  SmokingCategory,
  type ICholesterolScore,
  type IQuestionnaireScores,
  type IRiskScores,
  TotalCholesterolHdlRatioCategory,
  QRiskCategory,
  HealthCheckSteps
} from '@dnhc-health-checks/shared';
import { AuditCategory } from '../../../lib/enum/health-check-answers';
import { healthyBiometricScores } from '../../../testData/biometricTestData';
import { type SessionItem } from '../../../lib/aws/dynamoDB/DbSessionService';
import { HealthCheckBuilder } from '../../../testData/healthCheck/healthCheckBuilder';

const config: Config = ConfigFactory.getConfig();
const dbAuditEvent = new DbAuditEvent(config.name);
const dbHealthCheckService = new DbHealthCheckService(config.name);
let sessionItem: SessionItem;
let testStartDate: string;

const questionnaire = questionnairesData();
const defaultQuestionnaireScores: IQuestionnaireScores = {
  activityCategory: ActivityCategory.ModeratelyActive,
  auditCategory: AuditCategory.NoRisk,
  auditScore: 0,
  bloodPressureCategory: BloodPressureCategory.High,
  bmiClassification: BmiClassification.Overweight,
  bmiScore: 27.6,
  gppaqScore: 4,
  smokingCategory: SmokingCategory.NeverSmoked
};

const defaultRiskScores: IRiskScores = {
  heartAge: 84,
  qRiskScore: 38.96,
  qRiskScoreCategory: QRiskCategory.High,
  scoreCalculationDate: '2024-08-13T09:04:53.804Z'
};

const cholesterol: ICholesterolScore = {
  overallCategory: OverallCholesterolCategory.High,
  totalCholesterol: 5.2,
  totalCholesterolCategory: TotalCholesterolCategory.High,
  hdlCholesterol: 1.2,
  hdlCholesterolCategory: HdlCholesterolCategory.Normal,
  totalCholesterolHdlRatio: 6.7,
  totalCholesterolHdlRatioCategory: TotalCholesterolHdlRatioCategory.High
};

const biometricScores = healthyBiometricScores(cholesterol);

async function viewDetailedResultsFor(
  mainResultsPage: MainResultsPage,
  detailedResultsPage: HTCPage
): Promise<void> {
  await detailedResultsPage.waitUntilLoaded();
  await detailedResultsPage.clickBackLink();
  await mainResultsPage.waitUntilLoaded();
}

test.beforeAll(async ({ testedUser }) => {
  await dbAuditEvent.deleteItemByNhsNumber(testedUser.nhsNumber);
  await dbHealthCheckService.deleteItemByNhsNumber(testedUser.nhsNumber);
});

test.beforeEach(async ({ testedUser, dbSessionService }) => {
  const healthCheckToCreate = new HealthCheckBuilder(testedUser)
    .withAgeAtCompletion(35)
    .withStep(HealthCheckSteps.GP_UPDATE_SUCCESS)
    .withQuestionnaire(questionnaire)
    .withQuestionnaireScores(defaultQuestionnaireScores)
    .withRiskScores(defaultRiskScores)
    .withBiometricScores(biometricScores)
    .build();
  await dbHealthCheckService.createHealthCheck(healthCheckToCreate);

  sessionItem = await dbSessionService.getLatestSessionItemsByNhsNumber(
    testedUser.nhsNumber
  );
});

test.afterEach(
  'Deleting a health check and events items from Db after tests',
  async ({ testedUser }) => {
    await dbAuditEvent.deleteItemByNhsNumber(testedUser.nhsNumber);
    await dbHealthCheckService.deleteItemByNhsNumber(testedUser.nhsNumber);
  }
);

test(
  'Verify the results pages are loaded correctly',
  {
    tag: ['@ui', '@results', '@regression']
  },
  async ({ resultsPages, testedUser }) => {
    testStartDate = new Date().toISOString();

    await test.step('Browse to the main result page and ensure if loads successfully', async () => {
      await resultsPages.mainResultsPage.goToMainResultsPageAndWaitForLoading();
      expect(await resultsPages.mainResultsPage.getHeaderText()).toContain(
        `Hello ${sessionItem.firstName}, here are your results`
      );

      await expect(resultsPages.mainResultsPage.currentAgeValue).toContainText(
        '35'
      );
      await expect(
        resultsPages.mainResultsPage.getHeartAgeHeaderValueText()
      ).toHaveText(defaultRiskScores.heartAge?.toString() ?? '');
      await expect(resultsPages.mainResultsPage.heartAgeHeader).toContainText(
        `${defaultRiskScores.heartAge?.toString()}`
      );

      await expect(
        resultsPages.mainResultsPage.getCvdRiskParagraph()
      ).toHaveText('38.96%');
      await expect(resultsPages.mainResultsPage.cvdRiskCategory).toHaveText(
        "You're at high risk of heart attack or stroke in the next 10 years"
      );

      await expect(resultsPages.mainResultsPage.getBmiValue()).toContainText(
        defaultQuestionnaireScores.bmiScore?.toString() ?? ''
      );
      await expect(resultsPages.mainResultsPage.getBmiCategory()).toContainText(
        defaultQuestionnaireScores.bmiClassification
          ?.toString()
          .toLowerCase() ?? ''
      );

      await expect(
        resultsPages.mainResultsPage.getBloodPressureValue()
      ).toContainText(
        `${questionnaire.bloodPressureSystolic}/${questionnaire.bloodPressureDiastolic}`
      );
      await expect(
        resultsPages.mainResultsPage.getBloodPressureCategoryText()
      ).toContainText(
        defaultQuestionnaireScores.bloodPressureCategory
          ?.toString()
          .toLowerCase() ?? ''
      );

      await expect(
        resultsPages.mainResultsPage.cholesterolValueText
      ).toContainText(
        String(biometricScores[0]?.scores?.cholesterol?.totalCholesterol ?? '')
      );
      await expect(
        resultsPages.mainResultsPage.cholesterolClassificationText
      ).toContainText('high');

      await expect(
        resultsPages.mainResultsPage.diabetesValueText
      ).toContainText(String(biometricScores[0]?.scores.diabetes?.hba1c) ?? '');
      await expect(
        resultsPages.mainResultsPage.diabetesClassificationText
      ).toContainText('moderate');

      await expect(
        resultsPages.mainResultsPage.getAlcoholUseValueText()
      ).toContainText(defaultQuestionnaireScores.auditScore?.toString() ?? '');
      await expect(
        resultsPages.mainResultsPage.getAlcoholClassificationText()
      ).toContainText('no risk');
      await expect(
        resultsPages.mainResultsPage.getPhysicalActivityCategoryText()
      ).toContainText('moderately active');
      await expect(
        resultsPages.mainResultsPage.getSmokingStatusValue()
      ).toContainText('You have never smoked');
    });

    await test.step('Expect audit event send', async () => {
      const lastMessage =
        await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
          testedUser.nhsNumber,
          AuditEventType.PatientResultsSummaryOpened,
          testStartDate
        );
      expect(lastMessage).toBeTruthy();
    });

    await test.step('Expect proper traffic light colors on the cards', async () => {
      // See enum RiskLevelColor for reference
      await expect(resultsPages.mainResultsPage.bmiCard).toHaveClass(
        /app-card--yellow/
      ); // Overweight, BMI 27
      await expect(resultsPages.mainResultsPage.bloodPressureCard).toHaveClass(
        /app-card--red/
      ); // category - High
      await expect(resultsPages.mainResultsPage.diabetesCard).toHaveClass(
        /app-card--yellow/
      ); // Low, 41 hba1c
      await expect(resultsPages.mainResultsPage.cholesterolCard).toHaveClass(
        /app-card--red/
      ); // totalCholesterolCategory - High
      await expect(resultsPages.mainResultsPage.alcoholCard).toHaveClass(
        /app-card--green/
      ); // Audit score 0
      await expect(
        resultsPages.mainResultsPage.physicalActivityCard
      ).toHaveClass(/app-card--yellow/); // Moderately active
      await expect(resultsPages.mainResultsPage.smokingCard).toHaveClass(
        /app-card--green/
      ); // Never smoked
    });

    await test.step('Ensure user can view details of BMI results', async () => {
      await resultsPages.mainResultsPage.clickBmiLink();
      await viewDetailedResultsFor(
        resultsPages.mainResultsPage,
        resultsPages.bmiResultsPage
      );
    });

    await test.step('Ensure user can view details of blood pressure results', async () => {
      await resultsPages.mainResultsPage.clickBloodPressureLink();
      await viewDetailedResultsFor(
        resultsPages.mainResultsPage,
        resultsPages.bloodPressureResultsPage
      );
    });

    await test.step('Ensure user can view details of diabetes results', async () => {
      await resultsPages.mainResultsPage.clickDiabetesLink();
      await viewDetailedResultsFor(
        resultsPages.mainResultsPage,
        resultsPages.diabetesResultsPage
      );
    });

    await test.step('Ensure user can view details of cholesterol results', async () => {
      await resultsPages.mainResultsPage.clickCholesterolLink();
      await viewDetailedResultsFor(
        resultsPages.mainResultsPage,
        resultsPages.cholesterolResultsPage
      );
    });

    await test.step('Ensure user can view details of alcohol results', async () => {
      await resultsPages.mainResultsPage.clickAlcoholLink();
      await viewDetailedResultsFor(
        resultsPages.mainResultsPage,
        resultsPages.alcoholResultsPage
      );
    });

    await test.step('Ensure user can view details of physical activity results', async () => {
      await resultsPages.mainResultsPage.clickPhysicalActivityLink();
      await viewDetailedResultsFor(
        resultsPages.mainResultsPage,
        resultsPages.physicalActivityResultsPage
      );
    });

    await test.step('Ensure user can view details of smoking results', async () => {
      await resultsPages.mainResultsPage.clickSmokingLink();
      await viewDetailedResultsFor(
        resultsPages.mainResultsPage,
        resultsPages.smokingResultsPage
      );
    });

    await test.step('Ensure user can view details of dementia results', async () => {
      await resultsPages.mainResultsPage.clickDementiaLink();
      await viewDetailedResultsFor(
        resultsPages.mainResultsPage,
        resultsPages.dementiaResultsPage
      );
    });

    await test.step('Check if PatientResultsDetailedOpenedPage event for dementia was created', async () => {
      const lastMessage =
        await dbAuditEvent.waitForAnAuditEventItemsByNhsNumberAndDetails(
          testedUser.nhsNumber,
          AuditEventType.PatientResultsDetailedOpened,
          'page',
          PatientResultsDetailedOpenedPage.Dementia,
          testStartDate
        );
      expect(lastMessage).toBeTruthy();
      expect(lastMessage?.details?.page).toEqual(
        PatientResultsDetailedOpenedPage.Dementia
      );
    });
  }
);
