import { BloodPressureLocation } from '@dnhc-health-checks/shared/model/enum/health-check-answers';
import { MockHealthCheckBuilder } from '../builders/mock-health-check-builder';
import { MockPatientBuilder } from '../builders/mock-patient-builder';
import { MockPatientGroup } from '../mock-patient-group';
import {
  BloodPressureCategory,
  BmiClassification,
  DiabetesCategory,
  HdlCholesterolCategory,
  OverallCholesterolCategory,
  OverallDiabetesCategory,
  TotalCholesterolCategory,
  TotalCholesterolHdlRatioCategory
} from '@dnhc-health-checks/shared/model/enum/score-categories';
import { QRiskCategory } from '@dnhc-health-checks/shared/model/risk-scores';
import { MockLabOrderBuilder } from '../builders/mock-lab-order-builder';
import { MockLabResultsBuilder } from '../builders/mock-lab-results-builder';

export class PatientsResultsCareCardsMockPatientGroup extends MockPatientGroup {
  private mockHealthCheck: MockHealthCheckBuilder;
  private mockBothTestsLabOrder: MockLabOrderBuilder;
  private mockCholesterolLabOrder: MockLabOrderBuilder;

  constructor() {
    super('patients-results-care-cards');
  }

  create(): void {
    this.mockHealthCheck = MockHealthCheckBuilder.basicHealthCheckWithResults();
    this.mockBothTestsLabOrder = MockLabOrderBuilder.labOrderForBothTests();
    this.mockCholesterolLabOrder =
      MockLabOrderBuilder.labOrderForCholesterolTest();

    this.addPatientWithModerateCvdRisk();
    this.addPatientWithHighCvdRisk();
    this.addPatientWithModerateCvdRiskUnderweight();
    this.addPatientWithModerateCvdRiskCholesterolHighDiabetesHighRisk();
    this.addPatientWithBmiUnderweight();
    this.addPatientWithCholesterolHigh();
    this.addPatientWithCholesterolVeryHigh();
    this.addPatientWithBmiUnderweightCholesterolVeryHigh();
    this.addPatientWithDiabetesHighRisk();
    this.addPatientWithDiabetesPossibleDiabetes();
    this.addPatientWithDiabetesPossibleDiabetesOtherUrgentRisks();
    this.addPatientWithDiabetesPossibleDiabetesOver86();
    this.addPatientWithDiabetesPossibleDiabetesOver86OtherUrgentRisks();
    this.addPatientWithHighBpAtHome();
    this.addPatientWithHighBpAtHomeDiabetesHighRisk();
    this.addPatientWithHighBpAtHomeDiabetesPossibleDiabetes();
    this.addPatientWithHighBpAtHomeDiabetesPossibleDiabetesOver86();
    this.addPatientWithHighBpAtHomeOtherUrgentRisks();
  }

  private addPatientWithModerateCvdRisk(): void {
    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Moderate CVD risk')
        .addHealthCheck(
          this.mockHealthCheck
            .clone()
            .setRiskScores({
              qRiskScore: 15,
              qRiskScoreCategory: QRiskCategory.Moderate,
              heartAge: 65,
              scoreCalculationDate: '2024-03-09T10:00:00.000Z'
            })
            .build()
        )
        .build()
    );
  }

  private addPatientWithHighCvdRisk(): void {
    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('High CVD risk')
        .addHealthCheck(
          this.mockHealthCheck
            .clone()
            .setRiskScores({
              qRiskScore: 25,
              qRiskScoreCategory: QRiskCategory.High,
              heartAge: 75,
              scoreCalculationDate: '2024-03-09T10:00:00.000Z'
            })
            .build()
        )
        .build()
    );
  }

  private addPatientWithModerateCvdRiskUnderweight(): void {
    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Moderate CVD risk - underweight')
        .addHealthCheck(
          this.mockHealthCheck
            .clone()
            .updateQuestionnaireScores({
              bmiClassification: BmiClassification.Underweight,
              bmiScore: 17
            })
            .setRiskScores({
              qRiskScore: 15,
              qRiskScoreCategory: QRiskCategory.Moderate,
              heartAge: 65,
              scoreCalculationDate: '2024-03-09T10:00:00.000Z'
            })
            .build()
        )
        .build()
    );
  }

  private addPatientWithModerateCvdRiskCholesterolHighDiabetesHighRisk(): void {
    const hba1c = 47;
    const totalCholesterol = 7;
    const hdlCholesterol = 1.2;
    const totalCholesterolHdlRatio = 5.8;

    const biometricScores = {
      date: new Date().toISOString(),
      scores: {
        diabetes: {
          category: DiabetesCategory.AtRisk,
          hba1c,
          overallCategory: OverallDiabetesCategory.AtRisk
        },
        cholesterol: {
          overallCategory: OverallCholesterolCategory.High,
          totalCholesterol,
          totalCholesterolCategory: TotalCholesterolCategory.High,
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
        .setTitle('Moderate CVD risk - cholesterol high - diabetes high risk')
        .addHealthCheck(
          this.mockHealthCheck
            .clone()
            .setRiskScores({
              qRiskScore: 5,
              qRiskScoreCategory: QRiskCategory.Moderate,
              heartAge: 45,
              scoreCalculationDate: '2024-03-09T10:00:00.000Z'
            })
            .setBiometricScores([biometricScores])
            .setLabOrder(this.mockBothTestsLabOrder.clone().build())
            .setLabResults([
              MockLabResultsBuilder.cholesterolLabResult(
                totalCholesterol,
                hdlCholesterol,
                totalCholesterolHdlRatio
              ).build(),
              MockLabResultsBuilder.diabetesLabResult(hba1c).build()
            ])
            .build()
        )
        .build()
    );
  }

  private addPatientWithBmiUnderweight(): void {
    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('BMI underweight')
        .addHealthCheck(
          this.mockHealthCheck
            .clone()
            .updateQuestionnaireScores({
              bmiClassification: BmiClassification.Underweight,
              bmiScore: 17
            })
            .setRiskScores({
              qRiskScore: 10,
              qRiskScoreCategory: QRiskCategory.Low,
              heartAge: 50,
              scoreCalculationDate: '2024-03-09T10:00:00.000Z'
            })
            .build()
        )
        .build()
    );
  }

  private addPatientWithCholesterolHigh(): void {
    const totalCholesterol = 7;
    const hdlCholesterol = 1.2;
    const totalCholesterolHdlRatio = 5.8;

    const biometricScores = {
      date: new Date().toISOString(),
      scores: {
        diabetes: {
          overallCategory: OverallDiabetesCategory.LowRiskNoBloodTest,
          category: DiabetesCategory.LowRiskNoBloodTest,
          hba1c: null
        },
        cholesterol: {
          overallCategory: OverallCholesterolCategory.High,
          totalCholesterol,
          totalCholesterolCategory: TotalCholesterolCategory.High,
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
        .setTitle('Cholesterol high')
        .addHealthCheck(
          this.mockHealthCheck
            .clone()
            .setRiskScores({
              qRiskScore: 10,
              qRiskScoreCategory: QRiskCategory.Low,
              heartAge: 50,
              scoreCalculationDate: '2024-03-09T10:00:00.000Z'
            })
            .setBiometricScores([biometricScores])
            .setLabOrder(this.mockCholesterolLabOrder.clone().build())
            .setLabResults([
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

  private addPatientWithCholesterolVeryHigh(): void {
    const totalCholesterol = 8.5;
    const hdlCholesterol = 1.2;
    const totalCholesterolHdlRatio = 7.1;

    const biometricScores = {
      date: new Date().toISOString(),
      scores: {
        diabetes: {
          overallCategory: OverallDiabetesCategory.LowRiskNoBloodTest,
          category: DiabetesCategory.LowRiskNoBloodTest,
          hba1c: null
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
        .setTitle('Cholesterol very high')
        .addHealthCheck(
          this.mockHealthCheck
            .clone()
            .setRiskScores({
              qRiskScore: 10,
              qRiskScoreCategory: QRiskCategory.Low,
              heartAge: 50,
              scoreCalculationDate: '2024-03-09T10:00:00.000Z'
            })
            .setBiometricScores([biometricScores])
            .setLabOrder(this.mockCholesterolLabOrder.clone().build())
            .setLabResults([
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

  private addPatientWithBmiUnderweightCholesterolVeryHigh(): void {
    const totalCholesterol = 8.5;
    const hdlCholesterol = 1.2;
    const totalCholesterolHdlRatio = 7.1;

    const biometricScores = {
      date: new Date().toISOString(),
      scores: {
        diabetes: {
          overallCategory: OverallDiabetesCategory.LowRiskNoBloodTest,
          category: DiabetesCategory.LowRiskNoBloodTest,
          hba1c: null
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
        .setTitle('BMI underweight - cholesterol very high')
        .addHealthCheck(
          this.mockHealthCheck
            .clone()
            .updateQuestionnaireScores({
              bmiClassification: BmiClassification.Underweight,
              bmiScore: 17
            })
            .setRiskScores({
              qRiskScore: 10,
              qRiskScoreCategory: QRiskCategory.Low,
              heartAge: 50,
              scoreCalculationDate: '2024-03-09T10:00:00.000Z'
            })
            .setBiometricScores([biometricScores])
            .setLabOrder(this.mockCholesterolLabOrder.clone().build())
            .setLabResults([
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

  private addPatientWithDiabetesHighRisk(): void {
    const hba1c = 45;
    const totalCholesterol = 4.0;
    const hdlCholesterol = 1.2;
    const totalCholesterolHdlRatio = 3.3;

    const biometricScores = {
      date: new Date().toISOString(),
      scores: {
        diabetes: {
          overallCategory: OverallDiabetesCategory.AtRisk,
          category: DiabetesCategory.AtRisk,
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
        .setTitle('Diabetes high risk')
        .addHealthCheck(
          this.mockHealthCheck
            .clone()
            .setRiskScores({
              qRiskScore: 10,
              qRiskScoreCategory: QRiskCategory.Low,
              heartAge: 50,
              scoreCalculationDate: '2024-03-09T10:00:00.000Z'
            })
            .setBiometricScores([biometricScores])
            .setLabOrder(this.mockBothTestsLabOrder.clone().build())
            .setLabResults([
              MockLabResultsBuilder.cholesterolLabResult(
                totalCholesterol,
                hdlCholesterol,
                totalCholesterolHdlRatio
              ).build(),
              MockLabResultsBuilder.diabetesLabResult(hba1c).build()
            ])
            .build()
        )
        .build()
    );
  }

  private addPatientWithDiabetesPossibleDiabetes(): void {
    const hba1c = 60;
    const totalCholesterol = 4.0;
    const hdlCholesterol = 1.2;
    const totalCholesterolHdlRatio = 3.3;

    const biometricScores = {
      date: new Date().toISOString(),
      scores: {
        diabetes: {
          overallCategory: OverallDiabetesCategory.High,
          category: DiabetesCategory.High,
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
        .setTitle('Diabetes possible diabetes')
        .addHealthCheck(
          this.mockHealthCheck
            .clone()
            .setRiskScores({
              qRiskScore: 10,
              qRiskScoreCategory: QRiskCategory.Low,
              heartAge: 50,
              scoreCalculationDate: '2024-03-09T10:00:00.000Z'
            })
            .setBiometricScores([biometricScores])
            .setLabOrder(this.mockBothTestsLabOrder.clone().build())
            .setLabResults([
              MockLabResultsBuilder.cholesterolLabResult(
                totalCholesterol,
                hdlCholesterol,
                totalCholesterolHdlRatio
              ).build(),
              MockLabResultsBuilder.diabetesLabResult(hba1c).build()
            ])
            .build()
        )
        .build()
    );
  }

  private addPatientWithDiabetesPossibleDiabetesOtherUrgentRisks(): void {
    const hba1c = 60;
    const totalCholesterol = 4.0;
    const hdlCholesterol = 1.2;
    const totalCholesterolHdlRatio = 3.3;

    const biometricScores = {
      date: new Date().toISOString(),
      scores: {
        diabetes: {
          overallCategory: OverallDiabetesCategory.High,
          category: DiabetesCategory.High,
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
        .setTitle('Diabetes possible diabetes - other urgent risks')
        .addHealthCheck(
          this.mockHealthCheck
            .clone()
            .updateQuestionnaireScores({
              bmiClassification: BmiClassification.Obese1,
              bmiScore: 30
            })
            .setRiskScores({
              qRiskScore: 25,
              qRiskScoreCategory: QRiskCategory.High,
              heartAge: 75,
              scoreCalculationDate: '2024-03-09T10:00:00.000Z'
            })
            .setBiometricScores([biometricScores])
            .setLabOrder(this.mockBothTestsLabOrder.clone().build())
            .setLabResults([
              MockLabResultsBuilder.cholesterolLabResult(
                totalCholesterol,
                hdlCholesterol,
                totalCholesterolHdlRatio
              ).build(),
              MockLabResultsBuilder.diabetesLabResult(hba1c).build()
            ])
            .build()
        )
        .build()
    );
  }

  private addPatientWithDiabetesPossibleDiabetesOver86(): void {
    const hba1c = 87;
    const totalCholesterol = 4.0;
    const hdlCholesterol = 1.2;
    const totalCholesterolHdlRatio = 3.3;

    const biometricScores = {
      date: new Date().toISOString(),
      scores: {
        diabetes: {
          overallCategory: OverallDiabetesCategory.High,
          category: DiabetesCategory.High,
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
        .setTitle('Diabetes possible diabetes over 86 mmol/mol')
        .addHealthCheck(
          this.mockHealthCheck
            .clone()
            .setRiskScores({
              qRiskScore: 10,
              qRiskScoreCategory: QRiskCategory.Low,
              heartAge: 50,
              scoreCalculationDate: '2024-03-09T10:00:00.000Z'
            })
            .setBiometricScores([biometricScores])
            .setLabOrder(this.mockBothTestsLabOrder.clone().build())
            .setLabResults([
              MockLabResultsBuilder.cholesterolLabResult(
                totalCholesterol,
                hdlCholesterol,
                totalCholesterolHdlRatio
              ).build(),
              MockLabResultsBuilder.diabetesLabResult(hba1c).build()
            ])
            .build()
        )
        .build()
    );
  }

  private addPatientWithDiabetesPossibleDiabetesOver86OtherUrgentRisks(): void {
    const hba1c = 87;
    const totalCholesterol = 8.5;
    const hdlCholesterol = 1.2;
    const totalCholesterolHdlRatio = 7.1;

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
          'Diabetes possible diabetes over 86 mmol/mol other urgent risks'
        )
        .addHealthCheck(
          this.mockHealthCheck
            .clone()
            .setRiskScores({
              qRiskScore: 25,
              qRiskScoreCategory: QRiskCategory.High,
              heartAge: 75,
              scoreCalculationDate: '2024-03-09T10:00:00.000Z'
            })
            .setBiometricScores([biometricScores])
            .setLabOrder(this.mockBothTestsLabOrder.clone().build())
            .setLabResults([
              MockLabResultsBuilder.cholesterolLabResult(
                totalCholesterol,
                hdlCholesterol,
                totalCholesterolHdlRatio
              ).build(),
              MockLabResultsBuilder.diabetesLabResult(hba1c).build()
            ])
            .build()
        )
        .build()
    );
  }

  private addPatientWithHighBpAtHome(): void {
    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('High BP at home')
        .addHealthCheck(
          this.mockHealthCheck
            .clone()
            .setRiskScores({
              qRiskScore: 10,
              qRiskScoreCategory: QRiskCategory.Low,
              heartAge: 50,
              scoreCalculationDate: '2024-03-09T10:00:00.000Z'
            })
            .updateQuestionnaire({
              bloodPressureDiastolic: 90,
              bloodPressureSystolic: 120,
              bloodPressureLocation: BloodPressureLocation.Monitor,
              isBloodPressureSectionSubmitted: true
            })
            .updateQuestionnaireScores({
              bloodPressureCategory: BloodPressureCategory.High
            })
            .build()
        )
        .build()
    );
  }

  private addPatientWithHighBpAtHomeDiabetesHighRisk(): void {
    const hba1c = 50;
    const totalCholesterol = 4.0;
    const hdlCholesterol = 1.2;
    const totalCholesterolHdlRatio = 3.3;

    const biometricScores = {
      date: new Date().toISOString(),
      scores: {
        diabetes: {
          overallCategory: OverallDiabetesCategory.AtRisk,
          category: DiabetesCategory.AtRisk,
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
        .setTitle('High BP at home - diabetes high risk')
        .addHealthCheck(
          this.mockHealthCheck
            .clone()
            .setRiskScores({
              qRiskScore: 10,
              qRiskScoreCategory: QRiskCategory.Low,
              heartAge: 50,
              scoreCalculationDate: '2024-03-09T10:00:00.000Z'
            })
            .updateQuestionnaire({
              bloodPressureDiastolic: 90,
              bloodPressureSystolic: 120,
              bloodPressureLocation: BloodPressureLocation.Monitor,
              isBloodPressureSectionSubmitted: true
            })
            .updateQuestionnaireScores({
              bloodPressureCategory: BloodPressureCategory.High
            })
            .setBiometricScores([biometricScores])
            .setLabOrder(this.mockBothTestsLabOrder.clone().build())
            .setLabResults([
              MockLabResultsBuilder.cholesterolLabResult(
                totalCholesterol,
                hdlCholesterol,
                totalCholesterolHdlRatio
              ).build(),
              MockLabResultsBuilder.diabetesLabResult(hba1c).build()
            ])
            .build()
        )
        .build()
    );
  }

  private addPatientWithHighBpAtHomeDiabetesPossibleDiabetes(): void {
    const hba1c = 50;
    const totalCholesterol = 4.0;
    const hdlCholesterol = 1.2;
    const totalCholesterolHdlRatio = 3.3;

    const biometricScores = {
      date: new Date().toISOString(),
      scores: {
        diabetes: {
          overallCategory: OverallDiabetesCategory.High,
          category: DiabetesCategory.High,
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
        .setTitle('High BP at home - diabetes possible diabetes')
        .addHealthCheck(
          this.mockHealthCheck
            .clone()
            .setRiskScores({
              qRiskScore: 10,
              qRiskScoreCategory: QRiskCategory.Low,
              heartAge: 50,
              scoreCalculationDate: '2024-03-09T10:00:00.000Z'
            })
            .updateQuestionnaire({
              bloodPressureDiastolic: 90,
              bloodPressureSystolic: 120,
              bloodPressureLocation: BloodPressureLocation.Monitor,
              isBloodPressureSectionSubmitted: true
            })
            .updateQuestionnaireScores({
              bloodPressureCategory: BloodPressureCategory.High
            })
            .setBiometricScores([biometricScores])
            .setLabOrder(this.mockBothTestsLabOrder.clone().build())
            .setLabResults([
              MockLabResultsBuilder.cholesterolLabResult(
                totalCholesterol,
                hdlCholesterol,
                totalCholesterolHdlRatio
              ).build(),
              MockLabResultsBuilder.diabetesLabResult(hba1c).build()
            ])
            .build()
        )
        .build()
    );
  }

  private addPatientWithHighBpAtHomeDiabetesPossibleDiabetesOver86(): void {
    const hba1c = 87;
    const totalCholesterol = 4.0;
    const hdlCholesterol = 1.2;
    const totalCholesterolHdlRatio = 3.3;

    const biometricScores = {
      date: new Date().toISOString(),
      scores: {
        diabetes: {
          overallCategory: OverallDiabetesCategory.High,
          category: DiabetesCategory.High,
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
        .setTitle(
          'High BP at home - diabetes possible diabetes over 86 mmol/mol'
        )
        .addHealthCheck(
          this.mockHealthCheck
            .clone()
            .setRiskScores({
              qRiskScore: 10,
              qRiskScoreCategory: QRiskCategory.Low,
              heartAge: 50,
              scoreCalculationDate: '2024-03-09T10:00:00.000Z'
            })
            .updateQuestionnaire({
              bloodPressureDiastolic: 90,
              bloodPressureSystolic: 120,
              bloodPressureLocation: BloodPressureLocation.Monitor,
              isBloodPressureSectionSubmitted: true
            })
            .updateQuestionnaireScores({
              bloodPressureCategory: BloodPressureCategory.High
            })
            .setBiometricScores([biometricScores])
            .setLabOrder(this.mockBothTestsLabOrder.clone().build())
            .setLabResults([
              MockLabResultsBuilder.cholesterolLabResult(
                totalCholesterol,
                hdlCholesterol,
                totalCholesterolHdlRatio
              ).build(),
              MockLabResultsBuilder.diabetesLabResult(hba1c).build()
            ])
            .build()
        )
        .build()
    );
  }

  private addPatientWithHighBpAtHomeOtherUrgentRisks(): void {
    const totalCholesterol = 8.5;
    const hdlCholesterol = 1.2;
    const totalCholesterolHdlRatio = 7.1;

    const biometricScores = {
      date: new Date().toISOString(),
      scores: {
        diabetes: {
          overallCategory: OverallDiabetesCategory.LowRiskNoBloodTest,
          category: DiabetesCategory.LowRiskNoBloodTest,
          hba1c: null
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
        .setTitle('High BP at home - other urgent risks')
        .addHealthCheck(
          this.mockHealthCheck
            .clone()
            .setRiskScores({
              qRiskScore: 25,
              qRiskScoreCategory: QRiskCategory.High,
              heartAge: 75,
              scoreCalculationDate: '2024-03-09T10:00:00.000Z'
            })
            .updateQuestionnaire({
              bloodPressureDiastolic: 90,
              bloodPressureSystolic: 120,
              bloodPressureLocation: BloodPressureLocation.Monitor,
              isBloodPressureSectionSubmitted: true
            })
            .updateQuestionnaireScores({
              bloodPressureCategory: BloodPressureCategory.High
            })
            .setBiometricScores([biometricScores])
            .setLabOrder(this.mockCholesterolLabOrder.clone().build())
            .setLabResults([
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
