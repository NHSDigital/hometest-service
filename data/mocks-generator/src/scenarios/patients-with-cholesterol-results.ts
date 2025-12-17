import { Sex } from '@dnhc-health-checks/shared/model/enum/health-check-answers';
import { MockHealthCheckBuilder } from '../builders/mock-health-check-builder';
import { MockPatientBuilder } from '../builders/mock-patient-builder';
import { MockPatientGroup } from '../mock-patient-group';
import {
  DiabetesCategory,
  HdlCholesterolCategory,
  OverallCholesterolCategory,
  OverallDiabetesCategory,
  TotalCholesterolCategory,
  TotalCholesterolHdlRatioCategory
} from '@dnhc-health-checks/shared/model/enum/score-categories';
import { MockLabOrderBuilder } from '../builders/mock-lab-order-builder';
import { MockLabResultsBuilder } from '../builders/mock-lab-results-builder';

export class PatientsWithCholesterolResultsMockPatientGroup extends MockPatientGroup {
  private readonly mockHealthCheck: MockHealthCheckBuilder;
  private readonly mockLabOrder: MockLabOrderBuilder;

  constructor() {
    super('patients-with-cholesterol-results');
    this.mockHealthCheck = MockHealthCheckBuilder.basicHealthCheckWithResults();
    this.mockLabOrder = MockLabOrderBuilder.labOrderForBothTests();
  }

  create(): void {
    this.addPatientWithNormalCholesterolRiskMale3GreenCards();
    this.addPatientAtCholesterolRiskMale2Green1RedCards();
    this.addPatientAtCholesterolRiskFemale1Green2RedCards();
    this.addPatientWithHighCholesterolRiskMale3RedCards();
    this.addPatientWithHighCholesterolRiskFemale2Green1RedCards();
    this.addPatientWithVeryHighCholesterolRiskAndNormalGoodCholesterolMale2Green1RedCards();
    this.addPatientWithVeryHighCholesterolRiskAndLowGoodCholesterolFemale2Green1RedCards();
  }

  private addPatientWithNormalCholesterolRiskMale3GreenCards(): void {
    const hba1c = 23;
    const totalCholesterol = 2;
    const hdlCholesterol = 1.3;
    const totalCholesterolHdlRatio = 5;

    const biometricScores = {
      date: new Date().toISOString(),
      scores: {
        diabetes: {
          overallCategory: OverallDiabetesCategory.Low,
          category: DiabetesCategory.Low,
          hba1c
        },
        cholesterol: {
          overallCategory: OverallCholesterolCategory.Normal,
          totalCholesterol,
          totalCholesterolCategory: TotalCholesterolCategory.Normal,
          hdlCholesterol,
          hdlCholesterolCategory: HdlCholesterolCategory.Normal,
          totalCholesterolHdlRatio,
          totalCholesterolHdlRatioCategory:
            TotalCholesterolHdlRatioCategory.Normal
        }
      }
    };

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Patient with normal cholesterol risk - Male 3 green cards')
        .addHealthCheck(
          this.mockHealthCheck
            .clone()
            .updateQuestionnaire({ sex: Sex.Male })
            .setBiometricScores([biometricScores])
            .setLabOrder(this.mockLabOrder.clone().build())
            .setLabResults([
              MockLabResultsBuilder.diabetesLabResult(hba1c).build(),
              MockLabResultsBuilder.cholesterolLabResult(
                totalCholesterol,
                hdlCholesterol,
                totalCholesterolHdlRatio
              ).build()
            ])
            .build()
        )
        .build()
    );
  }

  private addPatientAtCholesterolRiskMale2Green1RedCards(): void {
    const hba1c = 49;
    const totalCholesterol = 4.5;
    const hdlCholesterol = 0.8;
    const totalCholesterolHdlRatio = 5;

    const biometricScores = {
      date: new Date().toISOString(),
      scores: {
        diabetes: {
          overallCategory: OverallDiabetesCategory.High,
          category: DiabetesCategory.High,
          hba1c
        },
        cholesterol: {
          overallCategory: OverallCholesterolCategory.AtRisk,
          totalCholesterol,
          totalCholesterolCategory: TotalCholesterolCategory.Normal,
          hdlCholesterol,
          hdlCholesterolCategory: HdlCholesterolCategory.Low,
          totalCholesterolHdlRatio,
          totalCholesterolHdlRatioCategory:
            TotalCholesterolHdlRatioCategory.Normal
        }
      }
    };

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Patient with at cholesterol risk - Male 2 green 1 red cards')
        .addHealthCheck(
          this.mockHealthCheck
            .clone()
            .updateQuestionnaire({ sex: Sex.Male })
            .setBiometricScores([biometricScores])
            .setLabOrder(this.mockLabOrder.clone().build())
            .setLabResults([
              MockLabResultsBuilder.diabetesLabResult(hba1c).build(),
              MockLabResultsBuilder.cholesterolLabResult(
                totalCholesterol,
                hdlCholesterol,
                totalCholesterolHdlRatio
              ).build()
            ])
            .build()
        )
        .build()
    );
  }

  private addPatientAtCholesterolRiskFemale1Green2RedCards(): void {
    const hba1c = 49;
    const totalCholesterol = 2.9;
    const hdlCholesterol = 0.8;
    const totalCholesterolHdlRatio = 6.1;

    const biometricScores = {
      date: new Date().toISOString(),
      scores: {
        diabetes: {
          overallCategory: OverallDiabetesCategory.High,
          category: DiabetesCategory.High,
          hba1c
        },
        cholesterol: {
          overallCategory: OverallCholesterolCategory.AtRisk,
          totalCholesterol,
          totalCholesterolCategory: TotalCholesterolCategory.Normal,
          hdlCholesterol,
          hdlCholesterolCategory: HdlCholesterolCategory.Low,
          totalCholesterolHdlRatio,
          totalCholesterolHdlRatioCategory:
            TotalCholesterolHdlRatioCategory.High
        }
      }
    };

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle(
          'Patient with at cholesterol risk - Female 1 green 2 red cards'
        )
        .addHealthCheck(
          this.mockHealthCheck
            .clone()
            .updateQuestionnaire({ sex: Sex.Female })
            .setBiometricScores([biometricScores])
            .setLabOrder(this.mockLabOrder.clone().build())
            .setLabResults([
              MockLabResultsBuilder.diabetesLabResult(hba1c).build(),
              MockLabResultsBuilder.cholesterolLabResult(
                totalCholesterol,
                hdlCholesterol,
                totalCholesterolHdlRatio
              ).build()
            ])
            .build()
        )
        .build()
    );
  }

  private addPatientWithHighCholesterolRiskMale3RedCards(): void {
    const hba1c = 49;
    const totalCholesterol = 6.1;
    const hdlCholesterol = 0.8;
    const totalCholesterolHdlRatio = 6.2;

    const biometricScores = {
      date: new Date().toISOString(),
      scores: {
        diabetes: {
          overallCategory: OverallDiabetesCategory.High,
          category: DiabetesCategory.High,
          hba1c
        },
        cholesterol: {
          overallCategory: OverallCholesterolCategory.High,
          totalCholesterol,
          totalCholesterolCategory: TotalCholesterolCategory.High,
          hdlCholesterol,
          hdlCholesterolCategory: HdlCholesterolCategory.Low,
          totalCholesterolHdlRatio,
          totalCholesterolHdlRatioCategory:
            TotalCholesterolHdlRatioCategory.High
        }
      }
    };

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Patient with high cholesterol risk - Male 3 red cards')
        .addHealthCheck(
          this.mockHealthCheck
            .clone()
            .updateQuestionnaire({ sex: Sex.Male })
            .setBiometricScores([biometricScores])
            .setLabOrder(this.mockLabOrder.clone().build())
            .setLabResults([
              MockLabResultsBuilder.diabetesLabResult(hba1c).build(),
              MockLabResultsBuilder.cholesterolLabResult(
                totalCholesterol,
                hdlCholesterol,
                totalCholesterolHdlRatio
              ).build()
            ])
            .build()
        )
        .build()
    );
  }

  private addPatientWithHighCholesterolRiskFemale2Green1RedCards(): void {
    const hba1c = 49;
    const totalCholesterol = 6.2;
    const hdlCholesterol = 1.3;
    const totalCholesterolHdlRatio = 4.0;

    const biometricScores = {
      date: new Date().toISOString(),
      scores: {
        diabetes: {
          overallCategory: OverallDiabetesCategory.High,
          category: DiabetesCategory.High,
          hba1c
        },
        cholesterol: {
          overallCategory: OverallCholesterolCategory.High,
          totalCholesterol,
          totalCholesterolCategory: TotalCholesterolCategory.High,
          hdlCholesterol,
          hdlCholesterolCategory: HdlCholesterolCategory.Normal,
          totalCholesterolHdlRatio,
          totalCholesterolHdlRatioCategory:
            TotalCholesterolHdlRatioCategory.Normal
        }
      }
    };

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle(
          'Patient with high cholesterol risk - Female 2 green 1 red cards'
        )
        .addHealthCheck(
          this.mockHealthCheck
            .clone()
            .updateQuestionnaire({ sex: Sex.Female })
            .setBiometricScores([biometricScores])
            .setLabOrder(this.mockLabOrder.clone().build())
            .setLabResults([
              MockLabResultsBuilder.diabetesLabResult(hba1c).build(),
              MockLabResultsBuilder.cholesterolLabResult(
                totalCholesterol,
                hdlCholesterol,
                totalCholesterolHdlRatio
              ).build()
            ])
            .build()
        )
        .build()
    );
  }

  private addPatientWithVeryHighCholesterolRiskAndNormalGoodCholesterolMale2Green1RedCards(): void {
    const hba1c = 49;
    const totalCholesterol = 7.6;
    const hdlCholesterol = 1.2;
    const totalCholesterolHdlRatio = 6.2;

    const biometricScores = {
      date: new Date().toISOString(),
      scores: {
        diabetes: {
          overallCategory: OverallDiabetesCategory.High,
          category: DiabetesCategory.High,
          hba1c
        },
        cholesterol: {
          overallCategory: OverallCholesterolCategory.VeryHigh,
          totalCholesterol,
          totalCholesterolCategory: TotalCholesterolCategory.VeryHigh,
          hdlCholesterol,
          hdlCholesterolCategory: HdlCholesterolCategory.Normal,
          totalCholesterolHdlRatio,
          totalCholesterolHdlRatioCategory:
            TotalCholesterolHdlRatioCategory.High
        }
      }
    };

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle(
          'Patient with very high cholesterol risk and normal good cholesterol - male 2 green 1 red cards'
        )
        .addHealthCheck(
          this.mockHealthCheck
            .clone()
            .updateQuestionnaire({ sex: Sex.Male })
            .setBiometricScores([biometricScores])
            .setLabOrder(this.mockLabOrder.clone().build())
            .setLabResults([
              MockLabResultsBuilder.diabetesLabResult(hba1c).build(),
              MockLabResultsBuilder.cholesterolLabResult(
                totalCholesterol,
                hdlCholesterol,
                totalCholesterolHdlRatio
              ).build()
            ])
            .build()
        )
        .build()
    );
  }

  private addPatientWithVeryHighCholesterolRiskAndLowGoodCholesterolFemale2Green1RedCards(): void {
    const hba1c = 49;
    const totalCholesterol = 7.9;
    const hdlCholesterol = 0.15;
    const totalCholesterolHdlRatio = 5.6;

    const biometricScores = {
      date: new Date().toISOString(),
      scores: {
        diabetes: {
          overallCategory: OverallDiabetesCategory.High,
          category: DiabetesCategory.High,
          hba1c
        },
        cholesterol: {
          overallCategory: OverallCholesterolCategory.VeryHigh,
          totalCholesterol: totalCholesterol,
          totalCholesterolCategory: TotalCholesterolCategory.VeryHigh,
          hdlCholesterol,
          hdlCholesterolCategory: HdlCholesterolCategory.Low,
          totalCholesterolHdlRatio,
          totalCholesterolHdlRatioCategory:
            TotalCholesterolHdlRatioCategory.Normal
        }
      }
    };

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle(
          'Patient with very high cholesterol risk and low good cholesterol - female 2 green 1 red cards'
        )
        .addHealthCheck(
          this.mockHealthCheck
            .clone()
            .updateQuestionnaire({ sex: Sex.Female })
            .setBiometricScores([biometricScores])
            .setLabOrder(this.mockLabOrder.clone().build())
            .setLabResults([
              MockLabResultsBuilder.diabetesLabResult(hba1c).build(),
              MockLabResultsBuilder.cholesterolLabResult(
                totalCholesterol,
                hdlCholesterol,
                totalCholesterolHdlRatio
              ).build()
            ])
            .build()
        )
        .build()
    );
  }
}
