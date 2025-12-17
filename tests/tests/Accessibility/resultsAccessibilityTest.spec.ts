import { type Page } from '@playwright/test';
import { test, expect } from '../../fixtures/commonFixture';
import AxeBuilder from '@axe-core/playwright';
import {
  createHtmlAccessibilityReport,
  tagList
} from '../../lib/AccessibilityTestReportHelper';
import { type Config, ConfigFactory } from '../../env/config';
import { type HTCPage } from '../../page-objects/HTCPage';
import { questionnairesData } from '../../testData/questionnairesTestData';
import DbAuditEvent from '../../lib/aws/dynamoDB/DbAuditEventService';
import DbHealthCheckService from '../../lib/aws/dynamoDB/DbHealthCheckService';
import {
  AuditCategory,
  SmokingCategory,
  BmiClassification,
  QRiskCategory,
  BloodPressureCategory,
  BloodPressureLocation,
  Smoking,
  type IQuestionnaireScores,
  ActivityCategory,
  type IRiskScores,
  DiabetesCategory,
  OverallDiabetesCategory,
  OverallCholesterolCategory,
  TotalCholesterolCategory,
  HdlCholesterolCategory,
  TotalCholesterolHdlRatioCategory,
  HealthCheckSteps,
  type IBiometricScores
} from '@dnhc-health-checks/shared';
import { RoutePath } from '../../route-paths';
import { type MainResultsPage } from '../../page-objects/ResultsPages';
import { healthyBiometricScores } from '../../testData/biometricTestData';
import { HealthCheckBuilder } from '../../testData/healthCheck/healthCheckBuilder';
import type { BaseTestUser } from '../../lib/users/BaseUser';

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

async function createHealthCheck(
  testedUser: BaseTestUser,
  biometricScores: IBiometricScores[]
) {
  const healthCheckToCreate = new HealthCheckBuilder(testedUser)
    .withStep(HealthCheckSteps.GP_UPDATE_SUCCESS)
    .withQuestionnaire(questionnaire)
    .withQuestionnaireScores(defaultQuestionnaireScores)
    .withRiskScores(defaultRiskScores)
    .withBiometricScores(biometricScores)
    .build();

  await dbHealthCheckService.createHealthCheck(healthCheckToCreate);
}

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

test(
  'Results accessibility tests',
  {
    tag: ['@accessibility', '@regression']
  },
  async ({ resultsPages, page, testedUser, config }) => {
    await test.step('Verify Results Overview page', async () => {
      await createHealthCheck(testedUser, healthyBiometricScores());

      await page.goto(`${config.questionnaireAppURL}/results-summary`);
      await resultsPages.mainResultsPage.waitUntilLoaded();

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(tagList)
        .analyze();
      expect(
        await createHtmlAccessibilityReport(
          accessibilityScanResults,
          'Overview',
          'Results',
          resultsPages.mainResultsPage
        )
      ).toHaveLength(0);
    });

    await test.step('Verify dementia results page', async () => {
      await resultsPages.mainResultsPage.clickDementiaLink();
      await verifyDetailedResultsPage(
        resultsPages.mainResultsPage,
        resultsPages.dementiaResultsPage,
        'DementiaResults',
        page
      );
    });
  }
);

Object.values(AuditCategory).forEach((auditCategory: AuditCategory) => {
  test(
    `Verify alcohol results page for audit category ${auditCategory}`,
    {
      tag: ['@accessibility', '@regression']
    },
    async ({ resultsPages, page, testedUser }) => {
      const questionnaireScores = {
        ...defaultQuestionnaireScores,
        auditCategory
      };

      const healthCheck = new HealthCheckBuilder(testedUser)
        .withStep(HealthCheckSteps.GP_UPDATE_SUCCESS)
        .withQuestionnaire(questionnaire)
        .withQuestionnaireScores(questionnaireScores)
        .withRiskScores(defaultRiskScores)
        .withBiometricScores(healthyBiometricScores())
        .build();
      await dbHealthCheckService.createHealthCheck(healthCheck);

      await page.goto(`${config.questionnaireAppURL}/results-summary`);
      await resultsPages.mainResultsPage.waitUntilLoaded();
      await resultsPages.mainResultsPage.clickAlcoholLink();

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

      await verifyDetailedResultsPage(
        resultsPages.mainResultsPage,
        resultsPages.alcoholResultsPage,
        `AlcoholResults - ${auditCategory}`,
        page
      );
    }
  );
});

// BMI test

[
  {
    category: BmiClassification.Underweight,
    expectedBmiScore: 18.4
  },
  {
    category: BmiClassification.Healthy,
    expectedBmiScore: 22.4
  },
  {
    category: BmiClassification.Overweight,
    expectedBmiScore: 27.4
  },
  {
    category: BmiClassification.Obese1,
    expectedBmiScore: 32.4
  },
  {
    category: BmiClassification.Obese2,
    expectedBmiScore: 37.4
  },
  {
    category: BmiClassification.Obese3,
    expectedBmiScore: 42.4
  }
].forEach(({ category, expectedBmiScore }) => {
  test(
    `Verify BMI results for BMI questionnaire value of ${expectedBmiScore} in category ${category}`,
    {
      tag: ['@accessibility', '@regression']
    },
    async ({ resultsPages, page, testedUser }) => {
      const questionnaireScores = {
        ...defaultQuestionnaireScores,
        bmiClassification: category,
        bmiScore: expectedBmiScore
      };

      const healthCheck = new HealthCheckBuilder(testedUser)
        .withStep(HealthCheckSteps.GP_UPDATE_SUCCESS)
        .withQuestionnaire(questionnaire)
        .withQuestionnaireScores(questionnaireScores)
        .withRiskScores(defaultRiskScores)
        .withBiometricScores(healthyBiometricScores())
        .build();
      await dbHealthCheckService.createHealthCheck(healthCheck);

      await page.goto(
        `${config.questionnaireAppURL}${RoutePath.BMIResultsPage}`
      );
      await resultsPages.bmiResultsPage.waitUntilLoaded();

      await verifyDetailedResultsPage(
        resultsPages.mainResultsPage,
        resultsPages.bmiResultsPage,
        `BMI Results-${category}`,
        page
      );
    }
  );
});

// cholesterol accessibility tests
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
    }
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
    }
  },
  {
    cholesterol: {
      overallCategory: OverallCholesterolCategory.High,
      totalCholesterol: 6,
      totalCholesterolCategory: TotalCholesterolCategory.High,
      hdlCholesterol: 1.3,
      hdlCholesterolCategory: HdlCholesterolCategory.Normal,
      totalCholesterolHdlRatio: 3.7,
      totalCholesterolHdlRatioCategory: TotalCholesterolHdlRatioCategory.Normal
    }
  },
  {
    cholesterol: {
      overallCategory: OverallCholesterolCategory.VeryHigh,
      totalCholesterol: 7.1,
      totalCholesterolCategory: TotalCholesterolCategory.VeryHigh,
      hdlCholesterol: 1.3,
      hdlCholesterolCategory: HdlCholesterolCategory.Normal,
      totalCholesterolHdlRatio: 3.7,
      totalCholesterolHdlRatioCategory: TotalCholesterolHdlRatioCategory.Normal
    }
  }
].forEach(({ cholesterol }) => {
  test(`Verify Cholesterol results for overall category ${cholesterol.overallCategory} for Biometricscores`, async ({
    resultsPages,
    page,
    testedUser
  }) => {
    await createHealthCheck(testedUser, healthyBiometricScores(cholesterol));

    await page.goto(
      `${config.questionnaireAppURL}${RoutePath.CholesterolResultsPage}`
    );
    await resultsPages.cholesterolResultsPage.waitUntilLoaded();

    await verifyDetailedResultsPage(
      resultsPages.mainResultsPage,
      resultsPages.cholesterolResultsPage,
      `Cholesterol Results-${cholesterol.overallCategory}`,
      page
    );
  });
});

// Smoking test

[
  { smokingCategory: SmokingCategory.NeverSmoked, smoking: Smoking.Never },
  { smokingCategory: SmokingCategory.ExSmoker, smoking: Smoking.Quitted },
  {
    smokingCategory: SmokingCategory.CurrentSmoker,
    smoking: Smoking.UpToNinePerDay
  },
  {
    smokingCategory: SmokingCategory.CurrentSmoker,
    smoking: Smoking.TenToNineteenPerDay
  },
  {
    smokingCategory: SmokingCategory.CurrentSmoker,
    smoking: Smoking.TwentyOrMorePerDay
  }
].forEach(({ smokingCategory, smoking }) => {
  test(`Verify smoking results page for smoking category ${smokingCategory} with ${smoking}`, async ({
    resultsPages,
    page,
    testedUser
  }) => {
    const questionnaireScores = {
      ...defaultQuestionnaireScores,
      smokingCategory
    };

    questionnaire.smoking = smoking;

    const healthCheck = new HealthCheckBuilder(testedUser)
      .withStep(HealthCheckSteps.GP_UPDATE_SUCCESS)
      .withQuestionnaire(questionnaire)
      .withQuestionnaireScores(questionnaireScores)
      .withRiskScores(defaultRiskScores)
      .withBiometricScores(healthyBiometricScores())
      .build();
    await dbHealthCheckService.createHealthCheck(healthCheck);

    await page.goto(
      `${config.questionnaireAppURL}${RoutePath.SmokingResultsPage}`
    );

    await resultsPages.smokingResultsPage.waitUntilLoaded();

    await verifyDetailedResultsPage(
      resultsPages.mainResultsPage,
      resultsPages.smokingResultsPage,
      `SmokingResults-${smokingCategory}-${smoking}`,
      page
    );
  });
});

[
  {
    diabetes: {
      overallCategory: OverallDiabetesCategory.LowRiskNoBloodTest,
      category: DiabetesCategory.LowRiskNoBloodTest,
      hba1c: 0
    },
    expectedRiskLevel: 'Low risk',
    expectedRiskDescription: "You're at low risk of getting type 2 diabetes."
  },
  {
    expectedRiskLevel: 'Low risk',
    diabetes: {
      overallCategory: OverallDiabetesCategory.Low,
      category: DiabetesCategory.Low,
      hba1c: 41
    },
    expectedRiskDescription:
      'Your blood sugar (glucose) reading is 41 mmol/mol. This is in the normal range. That means that you are at low risk of developing type 2 diabetes.'
  },
  {
    diabetes: {
      overallCategory: OverallDiabetesCategory.AtRisk,
      category: DiabetesCategory.AtRisk,
      hba1c: 45
    },
    expectedRiskLevel: 'At risk',
    expectedRiskDescription:
      'Your blood sugar (glucose) reading is 45 mmol/mol. This suggests you’re at risk of developing type 2 diabetes.'
  },
  {
    diabetes: {
      overallCategory: OverallDiabetesCategory.High,
      category: DiabetesCategory.High,
      hba1c: 49
    },
    expectedRiskLevel: 'High risk',
    expectedRiskDescription:
      'Your blood sugar (glucose) reading is 49 mmol/mol. This suggests you’re at high risk of type 2 diabetes.'
  }
].forEach(({ expectedRiskLevel, expectedRiskDescription, diabetes }) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let testStartDate: string;

  test(
    `Ensure user can view ${expectedRiskLevel} diabetes results and ${diabetes.category}`,
    {
      tag: ['@accessibility', '@regression']
    },
    async ({ resultsPages, page, testedUser }) => {
      testStartDate = new Date().toISOString();

      const questionnaireScores = {
        ...defaultQuestionnaireScores,
        riskLevel: expectedRiskLevel,
        riskDescription: expectedRiskDescription
      };

      const healthCheck = new HealthCheckBuilder(testedUser)
        .withStep(HealthCheckSteps.GP_UPDATE_SUCCESS)
        .withQuestionnaire(questionnaire)
        .withQuestionnaireScores(questionnaireScores)
        .withRiskScores(defaultRiskScores)
        .withBiometricScores(healthyBiometricScores(undefined, diabetes))
        .build();
      await dbHealthCheckService.createHealthCheck(healthCheck);

      await page.goto(
        `${config.questionnaireAppURL}${RoutePath.DiabetesRiskResultsPage}`
      );
      await resultsPages.diabetesResultsPage.waitUntilLoaded();

      await verifyDetailedResultsPage(
        resultsPages.mainResultsPage,
        resultsPages.diabetesResultsPage,
        `DiabetesResults-${expectedRiskLevel}`,
        page
      );

      await test.step('Verify diabetes results page', async () => {
        const healthCheck = new HealthCheckBuilder(testedUser)
          .withStep(HealthCheckSteps.GP_UPDATE_SUCCESS)
          .withQuestionnaire(questionnaire)
          .withQuestionnaireScores(questionnaireScores)
          .withRiskScores(defaultRiskScores)
          .withBiometricScores(healthyBiometricScores())
          .build();
        await dbHealthCheckService.createHealthCheck(healthCheck);

        await resultsPages.mainResultsPage.clickDiabetesLink();
        await verifyDetailedResultsPage(
          resultsPages.mainResultsPage,
          resultsPages.diabetesResultsPage,
          'DiabetesRiskResults',
          page
        );
      });
    }
  );
});

// Blood Pressure test
[
  [BloodPressureCategory.Low, 80, 59, BloodPressureLocation.Monitor],
  [BloodPressureCategory.Healthy, 120, 60, BloodPressureLocation.Monitor],
  [
    BloodPressureCategory.SlightlyRaised,
    121,
    81,
    BloodPressureLocation.Monitor
  ],
  [BloodPressureCategory.High, 169, 99, BloodPressureLocation.Monitor],
  [BloodPressureCategory.Low, 80, 59, BloodPressureLocation.Pharmacy],
  [BloodPressureCategory.Healthy, 120, 60, BloodPressureLocation.Pharmacy],
  [
    BloodPressureCategory.SlightlyRaised,
    121,
    81,
    BloodPressureLocation.Pharmacy
  ],
  [BloodPressureCategory.High, 169, 99, BloodPressureLocation.Pharmacy]
].forEach(
  ([
    bloodPressureCategory,
    bloodPressureSystolic,
    bloodPressureDiastolic,
    bloodPressureLocation
  ]) => {
    test(`Results Accessibility tests for bloodPressureCategory ${bloodPressureCategory}, bloodPressureLocation ${bloodPressureLocation}`, async ({
      resultsPages,
      page,
      testedUser,
      config
    }) => {
      await test.step('Verify blood pressure results page', async () => {
        questionnaire.bloodPressureSystolic = bloodPressureSystolic as number;
        questionnaire.bloodPressureDiastolic = bloodPressureDiastolic as number;
        defaultQuestionnaireScores.bloodPressureCategory =
          bloodPressureCategory as BloodPressureCategory;
        questionnaire.bloodPressureLocation =
          bloodPressureLocation as BloodPressureLocation;
        await createHealthCheck(testedUser, healthyBiometricScores());
        await page.goto(
          `${config.questionnaireAppURL}${RoutePath.BloodPressureResultsPage}`
        );
        await resultsPages.bloodPressureResultsPage.waitUntilLoaded();

        await verifyDetailedResultsPage(
          resultsPages.mainResultsPage,
          resultsPages.bloodPressureResultsPage,
          `BloodPressureResults-${bloodPressureCategory}-${bloodPressureLocation}`,
          page
        );
      });
    });
  }
);

async function verifyDetailedResultsPage(
  mainResultsPage: MainResultsPage,
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

  await detailedResultsPage.clickBackLink();
  await mainResultsPage.waitUntilLoaded();
}
