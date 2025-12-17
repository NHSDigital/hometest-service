import { DiabetesCategory, OverallCholesterolCategory, OverallDiabetesCategory, TotalCholesterolCategory, HdlCholesterolCategory, type IBiometricScores, type ICholesterolScore, type IDiabetesScore, TotalCholesterolHdlRatioCategory } from '@dnhc-health-checks/shared';

export function healthyCholesterolScores(
  override?: Partial<ICholesterolScore>
): ICholesterolScore {
  return {
    overallCategory: OverallCholesterolCategory.Normal,
    totalCholesterol: 4,
    totalCholesterolCategory: TotalCholesterolCategory.Normal,
    hdlCholesterol: 1.5,
    hdlCholesterolCategory: HdlCholesterolCategory.Low,
    totalCholesterolHdlRatio: 5,
    totalCholesterolHdlRatioCategory: TotalCholesterolHdlRatioCategory.Normal,
    ...override
  };
}

export function healthyDiabetesScores(
  override?: Partial<IDiabetesScore>
): IDiabetesScore {
  return {
    hba1c: 40,
    category: DiabetesCategory.Low,
    overallCategory: OverallDiabetesCategory.Low,
    ...override
  };
}

export function healthyBiometricScores(
  cholesterolData: ICholesterolScore = healthyCholesterolScores(),
  diabetesData: IDiabetesScore = healthyDiabetesScores(),
  scoreDate: string = new Date().toISOString()
): IBiometricScores[] {
  return [
    {
      date: scoreDate,
      scores: {
        cholesterol: cholesterolData,
        diabetes: diabetesData
      }
    }
  ];
}
