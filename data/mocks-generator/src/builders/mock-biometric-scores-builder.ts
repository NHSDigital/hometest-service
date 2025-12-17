import {
  type IBiometricScores,
  type IScores,
  type IDiabetesScore,
  type ICholesterolScore,
  DiabetesCategory,
  OverallDiabetesCategory,
  OverallCholesterolCategory,
  TotalCholesterolCategory,
  HdlCholesterolCategory,
  TotalCholesterolHdlRatioCategory
} from '@dnhc-health-checks/shared';

export class MockBiometricScoresBuilder {
  private readonly biometricScores: Partial<IBiometricScores> = {};

  setDate(date: string): this {
    this.biometricScores.date = date;
    return this;
  }

  setScores(scores: IScores): this {
    this.biometricScores.scores = scores;
    return this;
  }

  setDiabetesScore(diabetesScore: IDiabetesScore): this {
    this.biometricScores.scores ??= {};
    this.biometricScores.scores.diabetes = diabetesScore;
    return this;
  }

  setCholesterolScore(cholesterolScore: ICholesterolScore): this {
    this.biometricScores.scores ??= {};
    this.biometricScores.scores.cholesterol = cholesterolScore;
    return this;
  }

  build(): IBiometricScores {
    return this.biometricScores as IBiometricScores;
  }

  static basicScores(): MockBiometricScoresBuilder {
    return new MockBiometricScoresBuilder()
      .setDate(new Date().toISOString())
      .setScores({
        diabetes: {
          overallCategory: OverallDiabetesCategory.Low,
          category: DiabetesCategory.Low,
          hba1c: 41
        },
        cholesterol: {
          overallCategory: OverallCholesterolCategory.Normal,
          totalCholesterol: 4,
          totalCholesterolCategory: TotalCholesterolCategory.Normal,
          hdlCholesterol: 0.9,
          hdlCholesterolCategory: HdlCholesterolCategory.Normal,
          totalCholesterolHdlRatio: 4.4,
          totalCholesterolHdlRatioCategory:
            TotalCholesterolHdlRatioCategory.Normal
        }
      });
  }
}
