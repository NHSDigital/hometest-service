import { type FC } from 'react';
import {
  type IHealthCheck,
  BmiClassification,
  BloodPressureCategory,
  BloodPressureLocation,
  OverallCholesterolCategory,
  OverallDiabetesCategory,
  QRiskCategory
} from '@dnhc-health-checks/shared';
import {
  CVDRiskModerateOrHigh,
  CVDRiskModerateOrHighBMIUnderweightCholesterol,
  CVDRiskModerateOrHighDiabetesOrBMICholesterol,
  BMIUnderweightAndCholesterolHighVeryHigh,
  CholesterolHigh,
  CholesterolVeryHigh,
  BMIUnderweight,
  DiabetesHighRisk,
  DiabetesPossibleDiabetes,
  DiabetesHighRiskOtherFactorsNoHighBp,
  PossibleDiabetesOver86Mol,
  PossibleDiabetesOver86MolAnyFactorNoHighBP,
  HighBPHome,
  HighBPDiabetesHighRiskOtherRiskFactorsAllowed,
  HighBPHomeOtherRiskFactorsNotDiabetes,
  HighBPHomePossibleDiabetesAnyOtherRiskFactor,
  HighBPPossibleDiabetesOver86AnyRiskFactorAllowed,
  FailedCholesterolDiabetes,
  FailedCholesterolDiabetesHighBPHome,
  FailedDiabetes,
  FailedCholesterolDiabetesHighRisk,
  FailedCholesterolPossibleDiabetes,
  FailedCholesterolPossibleDiabetesOver86,
  FailedCholesterolHighBPHome,
  FailedCholesterolDiabetesHighRiskHighBPHome,
  FailedCholesterolPossibleDiabetesHighBPHome,
  FailedCholesterolPossibleDiabetesOver86HighBPHome
} from './RiskCards';
import { getLatestBiometricScores } from '../../../services/biometrics-score-service';

interface UrgentRiskFactorsToDisplayComponent {
  qRiskScoreHigh: boolean;
  qRiskScoreModerate: boolean;
  bmiUnderweight: boolean;
  cholesterolHigh: boolean;
  cholesterolVeryHigh: boolean;
  cholesterolFailure: boolean;
  cholesterolPartialFailure: boolean;
  cholesterolFullFailure: boolean;
  diabetesHighRisk: boolean;
  diabetesPossibleDiabetes: boolean;
  diabetesHbA1cOver86: boolean;
  diabetesFailure: boolean;
  bloodPressureHighHome: boolean;
}

type ConditionFn = (factors: UrgentRiskFactorsToDisplayComponent) => boolean;
const riskFactorCardMap: Array<{
  condition: ConditionFn;
  component: FC;
}> = [
  {
    // CVD risk moderate or high only
    condition: (factors: UrgentRiskFactorsToDisplayComponent): boolean =>
      Boolean(
        (factors.qRiskScoreHigh || factors.qRiskScoreModerate) &&
          !factors.bmiUnderweight &&
          !factors.cholesterolHigh &&
          !factors.cholesterolVeryHigh &&
          !factors.cholesterolFailure &&
          !factors.diabetesHighRisk &&
          !factors.diabetesPossibleDiabetes &&
          !factors.bloodPressureHighHome
      ),
    component: CVDRiskModerateOrHigh
  },
  {
    // Check: CVD risk moderate or high AND BMI underweight OR cholesterol high/very high
    condition: (factors: UrgentRiskFactorsToDisplayComponent): boolean =>
      Boolean(
        (factors.qRiskScoreHigh || factors.qRiskScoreModerate) &&
          (factors.bmiUnderweight ||
            factors.cholesterolHigh ||
            factors.cholesterolVeryHigh) &&
          !factors.cholesterolFailure &&
          !factors.diabetesHighRisk &&
          !factors.diabetesPossibleDiabetes &&
          !factors.bloodPressureHighHome
      ),
    component: CVDRiskModerateOrHighBMIUnderweightCholesterol
  },
  {
    // Check: CVD risk moderate or high AND diabetes high risk AND BMI underweight OR cholesterol high/very high
    condition: (factors: UrgentRiskFactorsToDisplayComponent): boolean =>
      Boolean(
        (factors.qRiskScoreHigh || factors.qRiskScoreModerate) &&
          factors.diabetesHighRisk &&
          (factors.bmiUnderweight ||
            factors.cholesterolHigh ||
            factors.cholesterolVeryHigh) &&
          !factors.cholesterolFailure &&
          !factors.diabetesPossibleDiabetes &&
          !factors.bloodPressureHighHome
      ),
    component: CVDRiskModerateOrHighDiabetesOrBMICholesterol
  },
  {
    // BMI underweight AND cholesterol high/very high
    condition: (factors: UrgentRiskFactorsToDisplayComponent): boolean =>
      Boolean(
        factors.bmiUnderweight &&
          (factors.cholesterolHigh || factors.cholesterolVeryHigh) &&
          !factors.qRiskScoreModerate &&
          !factors.qRiskScoreHigh &&
          !factors.cholesterolFailure &&
          !factors.diabetesHighRisk &&
          !factors.diabetesPossibleDiabetes &&
          !factors.bloodPressureHighHome
      ),
    component: BMIUnderweightAndCholesterolHighVeryHigh
  },
  {
    // Cholesterol high
    condition: (factors: UrgentRiskFactorsToDisplayComponent): boolean =>
      Boolean(
        factors.cholesterolHigh &&
          !factors.bmiUnderweight &&
          !factors.cholesterolVeryHigh &&
          !factors.qRiskScoreModerate &&
          !factors.qRiskScoreHigh &&
          !factors.diabetesHighRisk &&
          !factors.diabetesPossibleDiabetes &&
          !factors.bloodPressureHighHome
      ),
    component: CholesterolHigh
  },
  {
    // Cholesterol very high
    condition: (factors: UrgentRiskFactorsToDisplayComponent): boolean =>
      Boolean(
        factors.cholesterolVeryHigh &&
          !factors.bmiUnderweight &&
          !factors.cholesterolHigh &&
          !factors.qRiskScoreModerate &&
          !factors.qRiskScoreHigh &&
          !factors.diabetesHighRisk &&
          !factors.diabetesPossibleDiabetes &&
          !factors.bloodPressureHighHome
      ),
    component: CholesterolVeryHigh
  },
  {
    // BMI underweight
    condition: (factors: UrgentRiskFactorsToDisplayComponent): boolean =>
      Boolean(
        factors.bmiUnderweight &&
          !factors.cholesterolHigh &&
          !factors.cholesterolVeryHigh &&
          !factors.cholesterolFailure &&
          !factors.qRiskScoreModerate &&
          !factors.qRiskScoreHigh &&
          !factors.diabetesHighRisk &&
          !factors.diabetesPossibleDiabetes &&
          !factors.bloodPressureHighHome
      ),
    component: BMIUnderweight
  },
  {
    // Diabetes - high risk
    condition: (factors: UrgentRiskFactorsToDisplayComponent): boolean =>
      Boolean(
        factors.diabetesHighRisk &&
          !factors.bmiUnderweight &&
          !factors.cholesterolHigh &&
          !factors.cholesterolVeryHigh &&
          !factors.cholesterolFailure &&
          !factors.qRiskScoreModerate &&
          !factors.qRiskScoreHigh &&
          !factors.diabetesPossibleDiabetes &&
          !factors.bloodPressureHighHome
      ),
    component: DiabetesHighRisk
  },
  {
    //  Diabetes - possible diabetes
    condition: (factors: UrgentRiskFactorsToDisplayComponent): boolean =>
      Boolean(
        factors.diabetesPossibleDiabetes &&
          !factors.bmiUnderweight &&
          !factors.cholesterolHigh &&
          !factors.cholesterolVeryHigh &&
          !factors.cholesterolFailure &&
          !factors.qRiskScoreModerate &&
          !factors.qRiskScoreHigh &&
          !factors.diabetesHighRisk &&
          !factors.diabetesHbA1cOver86 &&
          !factors.diabetesFailure &&
          !factors.bloodPressureHighHome
      ),
    component: DiabetesPossibleDiabetes
  },
  {
    // Diabetes - possible diabetes and any other urgent risk factor (apart from high BP at home)
    condition: (factors: UrgentRiskFactorsToDisplayComponent): boolean =>
      Boolean(
        factors.diabetesPossibleDiabetes &&
          (factors.bmiUnderweight ||
            factors.cholesterolHigh ||
            factors.cholesterolVeryHigh ||
            factors.qRiskScoreModerate ||
            factors.qRiskScoreHigh) &&
          !factors.cholesterolFailure &&
          !factors.diabetesHighRisk &&
          !factors.diabetesHbA1cOver86 &&
          !factors.bloodPressureHighHome
      ),
    component: DiabetesHighRiskOtherFactorsNoHighBp
  },
  {
    // Diabetes - possible diabetes over 86 mmol/mol
    condition: (factors: UrgentRiskFactorsToDisplayComponent): boolean =>
      Boolean(
        factors.diabetesPossibleDiabetes &&
          factors.diabetesHbA1cOver86 &&
          !factors.bmiUnderweight &&
          !factors.cholesterolHigh &&
          !factors.cholesterolVeryHigh &&
          !factors.cholesterolFailure &&
          !factors.qRiskScoreModerate &&
          !factors.qRiskScoreHigh &&
          !factors.diabetesHighRisk &&
          !factors.bloodPressureHighHome
      ),
    component: PossibleDiabetesOver86Mol
  },
  {
    // Diabetes - possible diabetes over 86 mmol/mol and any other urgent risk factor (apart from high BP at home)
    condition: (factors: UrgentRiskFactorsToDisplayComponent): boolean =>
      Boolean(
        factors.diabetesPossibleDiabetes &&
          factors.diabetesHbA1cOver86 &&
          (factors.bmiUnderweight ||
            factors.cholesterolHigh ||
            factors.cholesterolVeryHigh ||
            factors.qRiskScoreModerate ||
            factors.qRiskScoreHigh) &&
          !factors.cholesterolFailure &&
          !factors.diabetesHighRisk &&
          !factors.bloodPressureHighHome
      ),
    component: PossibleDiabetesOver86MolAnyFactorNoHighBP
  },
  {
    // High blood pressure at home
    condition: (factors: UrgentRiskFactorsToDisplayComponent): boolean =>
      Boolean(
        factors.bloodPressureHighHome &&
          !factors.bmiUnderweight &&
          !factors.cholesterolHigh &&
          !factors.cholesterolVeryHigh &&
          !factors.cholesterolFailure &&
          !factors.qRiskScoreModerate &&
          !factors.qRiskScoreHigh &&
          !factors.diabetesHighRisk &&
          !factors.diabetesPossibleDiabetes &&
          !factors.diabetesFailure
      ),
    component: HighBPHome
  },
  {
    //  High blood pressure at home and at least one other risk factor that triggers a care card
    condition: (factors: UrgentRiskFactorsToDisplayComponent): boolean =>
      Boolean(
        factors.bloodPressureHighHome &&
          (factors.bmiUnderweight ||
            factors.cholesterolHigh ||
            factors.cholesterolVeryHigh ||
            factors.qRiskScoreModerate ||
            factors.qRiskScoreHigh) &&
          !factors.cholesterolFailure &&
          !factors.diabetesHighRisk &&
          !factors.diabetesPossibleDiabetes
      ),
    component: HighBPHomeOtherRiskFactorsNotDiabetes
  },
  {
    // High blood pressure at home and high risk of diabetes (and any other)
    condition: (factors: UrgentRiskFactorsToDisplayComponent): boolean =>
      Boolean(
        factors.bloodPressureHighHome &&
          factors.diabetesHighRisk &&
          !factors.cholesterolFailure
      ),
    component: HighBPDiabetesHighRiskOtherRiskFactorsAllowed
  },
  {
    // High blood pressure and possible diabetes (and any other)
    condition: (factors: UrgentRiskFactorsToDisplayComponent): boolean =>
      Boolean(
        factors.bloodPressureHighHome &&
          factors.diabetesPossibleDiabetes &&
          !factors.diabetesHbA1cOver86 &&
          !(factors.cholesterolPartialFailure || factors.cholesterolFullFailure)
      ),
    component: HighBPHomePossibleDiabetesAnyOtherRiskFactor
  },
  {
    // High blood pressure at home and possible diabetes over 86mmol/mol (and any other)
    condition: (factors: UrgentRiskFactorsToDisplayComponent): boolean =>
      Boolean(
        factors.bloodPressureHighHome &&
          factors.diabetesPossibleDiabetes &&
          factors.diabetesHbA1cOver86 &&
          !(factors.cholesterolPartialFailure || factors.cholesterolFullFailure)
      ),
    component: HighBPPossibleDiabetesOver86AnyRiskFactorAllowed
  },
  {
    // full/partial cholesterol failure - diabetes failure
    condition: (factors: UrgentRiskFactorsToDisplayComponent): boolean =>
      Boolean(
        factors.cholesterolFailure &&
          factors.diabetesFailure &&
          !factors.bloodPressureHighHome
      ),
    component: FailedCholesterolDiabetes
  },
  {
    // full/partial cholesterol failure - diabetes failure - high blood pressure
    condition: (factors: UrgentRiskFactorsToDisplayComponent): boolean =>
      Boolean(
        factors.cholesterolFailure &&
          factors.diabetesFailure &&
          factors.bloodPressureHighHome
      ),
    component: FailedCholesterolDiabetesHighBPHome
  },
  {
    // full cholesterol - diabetes failure - cvd low
    condition: (factors: UrgentRiskFactorsToDisplayComponent): boolean =>
      Boolean(
        factors.diabetesFailure &&
          !factors.cholesterolFailure &&
          !factors.qRiskScoreModerate &&
          !factors.qRiskScoreHigh &&
          !factors.bloodPressureHighHome
      ),
    component: FailedDiabetes
  },
  {
    // full/partial cholesterol failure - diabetes high risk
    condition: (factors: UrgentRiskFactorsToDisplayComponent): boolean =>
      Boolean(
        factors.diabetesHighRisk &&
          factors.cholesterolFailure &&
          !factors.bloodPressureHighHome &&
          !factors.diabetesPossibleDiabetes
      ),
    component: FailedCholesterolDiabetesHighRisk
  },
  {
    // full/partial cholesterol failure - possible diabetes
    condition: (factors: UrgentRiskFactorsToDisplayComponent): boolean =>
      Boolean(
        factors.diabetesPossibleDiabetes &&
          factors.cholesterolFailure &&
          !factors.bloodPressureHighHome &&
          !factors.diabetesHbA1cOver86
      ),
    component: FailedCholesterolPossibleDiabetes
  },
  {
    // full/partial cholesterol failure - possible diabetes over 86mmol/mol
    condition: (factors: UrgentRiskFactorsToDisplayComponent): boolean =>
      Boolean(
        factors.diabetesPossibleDiabetes &&
          factors.diabetesHbA1cOver86 &&
          factors.cholesterolFailure &&
          !factors.bloodPressureHighHome
      ),
    component: FailedCholesterolPossibleDiabetesOver86
  },
  {
    // full/partial cholesterol failure - diabetes low - high bp at home
    condition: (factors: UrgentRiskFactorsToDisplayComponent): boolean =>
      Boolean(
        factors.bloodPressureHighHome &&
          factors.cholesterolFailure &&
          !factors.diabetesFailure &&
          !factors.diabetesHighRisk &&
          !factors.diabetesPossibleDiabetes &&
          !factors.diabetesHbA1cOver86
      ),
    component: FailedCholesterolHighBPHome
  },
  {
    // full/partial cholesterol failure - diabetes high risk - high bp at home
    condition: (factors: UrgentRiskFactorsToDisplayComponent): boolean =>
      Boolean(
        factors.bloodPressureHighHome &&
          factors.diabetesHighRisk &&
          factors.cholesterolFailure &&
          !factors.diabetesPossibleDiabetes &&
          !factors.diabetesHbA1cOver86
      ),
    component: FailedCholesterolDiabetesHighRiskHighBPHome
  },
  {
    // full/partial cholesterol failure - possible diabetes - high bp at home
    condition: (factors: UrgentRiskFactorsToDisplayComponent): boolean =>
      Boolean(
        factors.bloodPressureHighHome &&
          factors.diabetesPossibleDiabetes &&
          factors.cholesterolFailure &&
          !factors.diabetesHighRisk &&
          !factors.diabetesHbA1cOver86
      ),
    component: FailedCholesterolPossibleDiabetesHighBPHome
  },
  {
    // full/partial cholesterol failure - possible diabetes over 86mmo/mol - high bp at home
    condition: (factors: UrgentRiskFactorsToDisplayComponent): boolean =>
      Boolean(
        factors.bloodPressureHighHome &&
          factors.diabetesPossibleDiabetes &&
          factors.diabetesHbA1cOver86 &&
          factors.cholesterolFailure
      ),
    component: FailedCholesterolPossibleDiabetesOver86HighBPHome
  }
];

const getRelevantCards = (
  userRiskFactors: UrgentRiskFactorsToDisplayComponent
): FC[] => {
  return (
    riskFactorCardMap
      .filter((mapping) => mapping.condition(userRiskFactors))
      .map((mapping) => mapping.component) ?? []
  );
};

export function ToDoNextFullResults({
  healthCheck
}: Readonly<{
  healthCheck: IHealthCheck;
}>) {
  const biometricScores = getLatestBiometricScores(healthCheck);
  const relevantCards = getRelevantCards({
    qRiskScoreHigh:
      healthCheck.riskScores?.qRiskScoreCategory === QRiskCategory.High,
    qRiskScoreModerate:
      healthCheck.riskScores?.qRiskScoreCategory === QRiskCategory.Moderate,
    bmiUnderweight:
      healthCheck.questionnaireScores?.bmiClassification ===
      BmiClassification.Underweight,
    cholesterolHigh:
      biometricScores.cholesterol?.overallCategory ===
      OverallCholesterolCategory.High,
    cholesterolVeryHigh:
      biometricScores.cholesterol?.overallCategory ===
      OverallCholesterolCategory.VeryHigh,
    cholesterolFailure:
      biometricScores.cholesterol?.overallCategory ===
        OverallCholesterolCategory.PartialFailure ||
      biometricScores.cholesterol?.overallCategory ===
        OverallCholesterolCategory.CompleteFailure,
    cholesterolPartialFailure:
      biometricScores.cholesterol?.overallCategory ===
      OverallCholesterolCategory.PartialFailure,
    cholesterolFullFailure:
      biometricScores.cholesterol?.overallCategory ===
      OverallCholesterolCategory.CompleteFailure,
    diabetesHighRisk:
      biometricScores.diabetes?.overallCategory ===
      OverallDiabetesCategory.AtRisk,
    diabetesPossibleDiabetes:
      biometricScores.diabetes?.overallCategory ===
      OverallDiabetesCategory.High,
    diabetesFailure:
      biometricScores.diabetes?.overallCategory ===
      OverallDiabetesCategory.CompleteFailure,
    diabetesHbA1cOver86: (biometricScores.diabetes?.hba1c ?? 0) > 86,
    bloodPressureHighHome:
      healthCheck.questionnaireScores?.bloodPressureCategory ===
        BloodPressureCategory.High &&
      healthCheck.questionnaire.bloodPressureLocation ===
        BloodPressureLocation.Monitor
  });

  const failedTests =
    biometricScores.cholesterol?.overallCategory ===
      OverallCholesterolCategory.PartialFailure ||
    biometricScores.cholesterol?.overallCategory ===
      OverallCholesterolCategory.CompleteFailure ||
    biometricScores.diabetes?.overallCategory ===
      OverallDiabetesCategory.CompleteFailure;

  if (relevantCards.length === 0) {
    if (failedTests) {
      // where we have partial results, dont render anything
      return <></>;
    }

    return (
      <>
        <h2>What to do next</h2>
        <p>
          You&apos;re making good choices for your health. Check what you can do
          to keep your risk low.
        </p>
      </>
    );
  }

  return (
    <>
      <h2>What to do next</h2>

      {relevantCards.map((CardComponent, index) => (
        <CardComponent key={index} />
      ))}
    </>
  );
}
