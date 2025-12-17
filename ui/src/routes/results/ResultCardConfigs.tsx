import {
  OverallDiabetesCategory,
  OverallCholesterolCategory,
  BmiClassification,
  SmokingCategory,
  AuditCategory,
  ActivityCategory,
  BloodPressureCategory,
  type Smoking
} from '@dnhc-health-checks/shared';
import { EnumDescriptions } from '../../lib/models/enum-descriptions';
import { RiskLevelColor } from '../../lib/models/RiskLevelColor';
import { RoutePath } from '../../lib/models/route-paths';

export interface ResultCardConfig {
  id: string;
  title: string;
  path: string;
  resultText: string | null;
  resultDetailsText?: string;
  mapResult: (value: string | undefined) => string | undefined;
  mapResultDetail: (value: string | undefined) => string | undefined;
  getTrafficLight: (category: string | undefined) => RiskLevelColor;
}

export interface ResultCardsConfig {
  BMI: ResultCardConfig;
  BloodPressure: ResultCardConfig;
  Diabetes: ResultCardConfig;
  PhysicalActivity: ResultCardConfig;
  Alcohol: ResultCardConfig;
  Cholesterol: ResultCardConfig;
  Smoking: ResultCardConfig;
}

function trafficLightBMI(category: string | undefined) {
  switch (category) {
    case BmiClassification.Underweight:
    case BmiClassification.Overweight:
      return RiskLevelColor.Yellow;
    case BmiClassification.Obese1:
    case BmiClassification.Obese2:
    case BmiClassification.Obese3:
      return RiskLevelColor.Red;
    default:
      return RiskLevelColor.Green;
  }
}

function trafficLightCholesterol(category: string | undefined) {
  switch (category) {
    case OverallCholesterolCategory.AtRisk:
      return RiskLevelColor.Yellow;
    case OverallCholesterolCategory.High:
    case OverallCholesterolCategory.VeryHigh:
      return RiskLevelColor.Red;
    default:
      return RiskLevelColor.Green;
  }
}

function trafficLightBloodPressure(category: string | undefined) {
  switch (category) {
    case BloodPressureCategory.Low:
    case BloodPressureCategory.SlightlyRaised:
      return RiskLevelColor.Yellow;
    case BloodPressureCategory.High:
      return RiskLevelColor.Red;
    default:
      return RiskLevelColor.Green;
  }
}

function trafficLightPhysicalActivity(category: string | undefined) {
  switch (category) {
    case ActivityCategory.ModeratelyActive:
    case ActivityCategory.ModeratelyInactive:
      return RiskLevelColor.Yellow;
    case ActivityCategory.Inactive:
      return RiskLevelColor.Red;
    default:
      return RiskLevelColor.Green;
  }
}

function trafficLightDiabetes(category: string | undefined) {
  switch (category) {
    case OverallDiabetesCategory.Low:
      return RiskLevelColor.Yellow;
    case OverallDiabetesCategory.AtRisk:
    case OverallDiabetesCategory.High:
      return RiskLevelColor.Red;
    default:
      return RiskLevelColor.Green;
  }
}

function trafficLightAlcohol(category: string | undefined) {
  switch (category) {
    case AuditCategory.IncreasingRisk:
      return RiskLevelColor.Yellow;
    case AuditCategory.HighRisk:
    case AuditCategory.PossibleDependency:
      return RiskLevelColor.Red;
    default:
      return RiskLevelColor.Green;
  }
}

function trafficLightSmoking(category: string | undefined) {
  switch (category) {
    case SmokingCategory.ExSmoker:
      return RiskLevelColor.Yellow;
    case SmokingCategory.CurrentSmoker:
      return RiskLevelColor.Red;
    default:
      return RiskLevelColor.Green;
  }
}

function mapOverallDiabetesCategory(
  category: string | undefined
): string | undefined {
  switch (category) {
    case OverallDiabetesCategory.LowRiskNoBloodTest:
      return 'Low';
    case OverallDiabetesCategory.Low:
      return 'Moderate';
    case OverallDiabetesCategory.AtRisk:
      return 'High';
    case OverallDiabetesCategory.High:
      return 'Possible diabetes';
    default:
      return 'UNKNOWN';
  }
}

function mapCholesterolCategory(
  category: string | undefined
): string | undefined {
  switch (category) {
    case OverallCholesterolCategory.Normal:
      return 'Healthy';
    case OverallCholesterolCategory.AtRisk:
      return 'At risk';
    case OverallCholesterolCategory.VeryHigh:
      return 'Very High';
    case OverallCholesterolCategory.High:
      return 'High';
    default:
      return 'UNKNOWN';
  }
}

function mapBMICategory(category: string | undefined): string | undefined {
  switch (category) {
    case BmiClassification.Healthy:
      return 'Healthy';
    case BmiClassification.Obese1:
    case BmiClassification.Obese2:
    case BmiClassification.Obese3:
      return 'Obese';
    case BmiClassification.Overweight:
      return 'Overweight';
    case BmiClassification.Underweight:
      return 'Underweight';
    default:
      return 'UNKNOWN';
  }
}

function getSmokingDisplayText(smokingStatus: string | undefined): string {
  if (!smokingStatus) {
    return 'No smoking information available';
  }

  return EnumDescriptions.Smoking[smokingStatus as Smoking].heading;
}

function getAlcoholDisplayText(auditCategory: string | undefined): string {
  if (!auditCategory) {
    return 'No alcohol score information available';
  }

  return EnumDescriptions.AuditCategory[auditCategory as AuditCategory];
}

function getPhysicalActivityDisplayText(
  activityCategory: string | undefined
): string {
  if (!activityCategory) {
    return 'No physical activity level information available';
  }

  return EnumDescriptions.ActivityCategory[
    activityCategory as ActivityCategory
  ];
}

function getBloodPressureDisplayText(
  bloodPressureCategory: string | undefined
): string {
  if (!bloodPressureCategory) {
    return 'No blood pressure reading information available';
  }

  return EnumDescriptions.BloodPressureCategory[
    bloodPressureCategory as BloodPressureCategory
  ];
}

export const cardsConfig: ResultCardsConfig = {
  BMI: {
    id: 'bmi',
    title: 'BMI results',
    path: RoutePath.BMIResultsPage,
    resultText: 'Your result is: ',
    resultDetailsText: 'This suggests you are ',
    mapResult: (value) => value,
    mapResultDetail: mapBMICategory,
    getTrafficLight: trafficLightBMI
  },
  BloodPressure: {
    id: 'blood-pressure',
    title: 'Blood pressure',
    path: RoutePath.BloodPressureResultsPage,
    resultText: 'Your reading is: ',
    resultDetailsText: 'Your blood pressure reading is ',
    mapResult: (value) => value,
    mapResultDetail: getBloodPressureDisplayText,
    getTrafficLight: trafficLightBloodPressure
  },
  Diabetes: {
    id: 'diabetes',
    title: 'Diabetes risk',
    path: RoutePath.DiabetesRiskResultsPage,
    resultText: 'Your result is: ',
    resultDetailsText: 'Your diabetes risk is ',
    mapResult: (value) => value,
    mapResultDetail: mapOverallDiabetesCategory,
    getTrafficLight: trafficLightDiabetes
  },
  PhysicalActivity: {
    id: 'physical-activity',
    title: 'Physical activity level',
    path: RoutePath.PhysicalActivityResultsPage,
    resultText: null,
    resultDetailsText: 'Your physical activity level is ',
    mapResult: (value) => value,
    mapResultDetail: getPhysicalActivityDisplayText,
    getTrafficLight: trafficLightPhysicalActivity
  },
  Alcohol: {
    id: 'alcohol',
    title: 'Alcohol risk results',
    path: RoutePath.AlcoholResultsPage,
    resultText: 'Your result is: ',
    resultDetailsText: 'Your alcohol score is ',
    mapResult: (value) => value,
    mapResultDetail: getAlcoholDisplayText,
    getTrafficLight: trafficLightAlcohol
  },
  Cholesterol: {
    id: 'cholesterol',
    title: 'Cholesterol risk',
    path: RoutePath.CholesterolResultsPage,
    resultText: 'Your result is: ',
    resultDetailsText: 'Your cholesterol levels are ',
    mapResult: (value) => value,
    mapResultDetail: mapCholesterolCategory,
    getTrafficLight: trafficLightCholesterol
  },
  Smoking: {
    id: 'smoking',
    title: 'Smoking status',
    path: RoutePath.SmokingResultsPage,
    resultText: '',
    mapResult: getSmokingDisplayText,
    mapResultDetail: (value) => value,
    getTrafficLight: trafficLightSmoking
  }
};
