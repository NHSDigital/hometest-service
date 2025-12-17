import {
  OverallCholesterolCategory,
  DiabetesCategory,
  BmiClassification,
  SmokingCategory,
  AuditCategory,
  ActivityCategory,
  BloodPressureCategory,
  Smoking
} from '@dnhc-health-checks/shared';
import { EnumDescriptions } from '../../../lib/models/enum-descriptions';
import { RiskLevelColor } from '../../../lib/models/RiskLevelColor';
import { cardsConfig } from '../../../routes/results/ResultCardConfigs';

describe('Result card configs', () => {
  const trafficLightTestCases: [
    (category: string | undefined) => RiskLevelColor,
    string | undefined,
    RiskLevelColor
  ][] = [
    [
      cardsConfig.BMI.getTrafficLight,
      BmiClassification.Healthy,
      RiskLevelColor.Green
    ],
    [
      cardsConfig.BMI.getTrafficLight,
      BmiClassification.Underweight,
      RiskLevelColor.Yellow
    ],
    [
      cardsConfig.BMI.getTrafficLight,
      BmiClassification.Overweight,
      RiskLevelColor.Yellow
    ],
    [
      cardsConfig.BMI.getTrafficLight,
      BmiClassification.Obese1,
      RiskLevelColor.Red
    ],
    [
      cardsConfig.BMI.getTrafficLight,
      BmiClassification.Obese2,
      RiskLevelColor.Red
    ],
    [
      cardsConfig.BMI.getTrafficLight,
      BmiClassification.Obese3,
      RiskLevelColor.Red
    ],
    [
      cardsConfig.BloodPressure.getTrafficLight,
      BloodPressureCategory.Healthy,
      RiskLevelColor.Green
    ],
    [
      cardsConfig.BloodPressure.getTrafficLight,
      BloodPressureCategory.Low,
      RiskLevelColor.Yellow
    ],
    [
      cardsConfig.BloodPressure.getTrafficLight,
      BloodPressureCategory.SlightlyRaised,
      RiskLevelColor.Yellow
    ],
    [
      cardsConfig.BloodPressure.getTrafficLight,
      BloodPressureCategory.High,
      RiskLevelColor.Red
    ],
    [
      cardsConfig.Diabetes.getTrafficLight,
      DiabetesCategory.LowRiskNoBloodTest,
      RiskLevelColor.Green
    ],
    [
      cardsConfig.Diabetes.getTrafficLight,
      DiabetesCategory.Low,
      RiskLevelColor.Yellow
    ],
    [
      cardsConfig.Diabetes.getTrafficLight,
      DiabetesCategory.AtRisk,
      RiskLevelColor.Red
    ],
    [
      cardsConfig.Diabetes.getTrafficLight,
      DiabetesCategory.High,
      RiskLevelColor.Red
    ],
    [
      cardsConfig.Cholesterol.getTrafficLight,
      OverallCholesterolCategory.Normal,
      RiskLevelColor.Green
    ],
    [
      cardsConfig.Cholesterol.getTrafficLight,
      OverallCholesterolCategory.AtRisk,
      RiskLevelColor.Yellow
    ],
    [
      cardsConfig.Cholesterol.getTrafficLight,
      OverallCholesterolCategory.High,
      RiskLevelColor.Red
    ],
    [
      cardsConfig.Cholesterol.getTrafficLight,
      OverallCholesterolCategory.VeryHigh,
      RiskLevelColor.Red
    ],
    [
      cardsConfig.Smoking.getTrafficLight,
      SmokingCategory.NeverSmoked,
      RiskLevelColor.Green
    ],
    [
      cardsConfig.Smoking.getTrafficLight,
      SmokingCategory.ExSmoker,
      RiskLevelColor.Yellow
    ],
    [
      cardsConfig.Smoking.getTrafficLight,
      SmokingCategory.CurrentSmoker,
      RiskLevelColor.Red
    ],
    [
      cardsConfig.Alcohol.getTrafficLight,
      AuditCategory.NoRisk,
      RiskLevelColor.Green
    ],
    [
      cardsConfig.Alcohol.getTrafficLight,
      AuditCategory.IncreasingRisk,
      RiskLevelColor.Yellow
    ],
    [
      cardsConfig.Alcohol.getTrafficLight,
      AuditCategory.HighRisk,
      RiskLevelColor.Red
    ],
    [
      cardsConfig.Alcohol.getTrafficLight,
      AuditCategory.PossibleDependency,
      RiskLevelColor.Red
    ],
    [
      cardsConfig.PhysicalActivity.getTrafficLight,
      ActivityCategory.Active,
      RiskLevelColor.Green
    ],
    [
      cardsConfig.PhysicalActivity.getTrafficLight,
      ActivityCategory.ModeratelyActive,
      RiskLevelColor.Yellow
    ],
    [
      cardsConfig.PhysicalActivity.getTrafficLight,
      ActivityCategory.ModeratelyInactive,
      RiskLevelColor.Yellow
    ],
    [
      cardsConfig.PhysicalActivity.getTrafficLight,
      ActivityCategory.Inactive,
      RiskLevelColor.Red
    ]
  ];

  test.each(trafficLightTestCases)(
    'getTrafficLight should return %s for category %s',
    (getTrafficLight, category, expected) => {
      expect(getTrafficLight(category)).toBe(expected);
    }
  );

  const mapResultTestCases: [
    (value: string | undefined) => string | undefined,
    string | undefined,
    string
  ][] = [
    [
      cardsConfig.Diabetes.mapResultDetail,
      DiabetesCategory.LowRiskNoBloodTest,
      'Low'
    ],
    [cardsConfig.Diabetes.mapResultDetail, DiabetesCategory.Low, 'Moderate'],
    [cardsConfig.Diabetes.mapResultDetail, DiabetesCategory.AtRisk, 'High'],
    [
      cardsConfig.Diabetes.mapResultDetail,
      DiabetesCategory.High,
      'Possible diabetes'
    ],
    [cardsConfig.Diabetes.mapResultDetail, 'something went wrong', 'UNKNOWN'],
    [
      cardsConfig.Cholesterol.mapResultDetail,
      OverallCholesterolCategory.Normal,
      'Healthy'
    ],
    [
      cardsConfig.Cholesterol.mapResultDetail,
      OverallCholesterolCategory.AtRisk,
      'At risk'
    ],
    [
      cardsConfig.Cholesterol.mapResultDetail,
      OverallCholesterolCategory.VeryHigh,
      'Very High'
    ],
    [
      cardsConfig.Cholesterol.mapResultDetail,
      OverallCholesterolCategory.High,
      'High'
    ],
    [
      cardsConfig.Cholesterol.mapResultDetail,
      'something went wrong',
      'UNKNOWN'
    ],
    [
      cardsConfig.Smoking.mapResult,
      undefined,
      'No smoking information available'
    ],
    [
      cardsConfig.Smoking.mapResult,
      Smoking.Never,
      EnumDescriptions.Smoking.Never.heading
    ],
    [
      cardsConfig.Smoking.mapResult,
      Smoking.Quitted,
      EnumDescriptions.Smoking.Quitted.heading
    ],
    [
      cardsConfig.Smoking.mapResult,
      Smoking.UpToNinePerDay,
      EnumDescriptions.Smoking.UpToNinePerDay.heading
    ],
    [
      cardsConfig.Smoking.mapResult,
      Smoking.TenToNineteenPerDay,
      EnumDescriptions.Smoking.TenToNineteenPerDay.heading
    ],
    [
      cardsConfig.Smoking.mapResult,
      Smoking.TwentyOrMorePerDay,
      EnumDescriptions.Smoking.TwentyOrMorePerDay.heading
    ],
    [cardsConfig.BMI.mapResultDetail, BmiClassification.Healthy, 'Healthy'],
    [cardsConfig.BMI.mapResultDetail, BmiClassification.Obese1, 'Obese'],
    [cardsConfig.BMI.mapResultDetail, BmiClassification.Obese2, 'Obese'],
    [cardsConfig.BMI.mapResultDetail, BmiClassification.Obese3, 'Obese'],
    [cardsConfig.BMI.mapResultDetail, BmiClassification.Healthy, 'Healthy'],
    [
      cardsConfig.BMI.mapResultDetail,
      BmiClassification.Overweight,
      'Overweight'
    ],
    [
      cardsConfig.BMI.mapResultDetail,
      BmiClassification.Underweight,
      'Underweight'
    ]
  ];

  test.each(mapResultTestCases)(
    'mapResultDetail should return %s for category %s',
    (mapResultDetail, category, expected) => {
      expect(mapResultDetail(category)).toBe(expected);
    }
  );
});
