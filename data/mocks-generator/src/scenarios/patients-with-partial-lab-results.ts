import { BloodPressureLocation } from '@dnhc-health-checks/shared/model/enum/health-check-answers';
import { MockHealthCheckBuilder } from '../builders/mock-health-check-builder';
import { MockPatientBuilder } from '../builders/mock-patient-builder';
import { MockPatientGroup } from '../mock-patient-group';
import {
  BloodPressureCategory,
  DiabetesCategory,
  HdlCholesterolCategory,
  OverallCholesterolCategory,
  OverallDiabetesCategory,
  TotalCholesterolCategory,
  TotalCholesterolHdlRatioCategory
} from '@dnhc-health-checks/shared/model/enum/score-categories';
import { LabTestType } from '@dnhc-health-checks/shared/model/enum/lab-result';
import { QRiskCategory } from '@dnhc-health-checks/shared/model/risk-scores';
import { BloodTestExpiryWritebackStatus } from '@dnhc-health-checks/shared/model/enum/expiry-statuses';
import { MockLabOrderBuilder } from '../builders/mock-lab-order-builder';
import { MockLabResultsBuilder } from '../builders/mock-lab-results-builder';

export class PatientsWithPartialLabResultsMockPatientGroup extends MockPatientGroup {
  constructor() {
    super('patients-with-partial-lab-results');
  }

  create(): void {
    const mockHealthCheck =
      MockHealthCheckBuilder.basicHealthCheckWithResults();
    const mockCholesterolLabOrder =
      MockLabOrderBuilder.labOrderForCholesterolTest();
    const mockBothTestsLabOrder = MockLabOrderBuilder.labOrderForBothTests();

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Cholesterol - reorder complete failure')
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .setBiometricScores([
              {
                date: new Date().toISOString(),
                scores: {
                  diabetes: {
                    overallCategory: OverallDiabetesCategory.LowRiskNoBloodTest,
                    category: DiabetesCategory.LowRiskNoBloodTest,
                    hba1c: null
                  },
                  cholesterol: {
                    overallCategory: OverallCholesterolCategory.CompleteFailure,
                    hdlCholesterolFailureReason: 'failure_reason',
                    totalCholesterolFailureReason: 'failure_reason',
                    totalCholesterolHdlRatioFailureReason: 'failure_reason'
                  }
                }
              },
              {
                date: new Date('2024-05-01').toISOString(),
                scores: {
                  diabetes: {
                    overallCategory: OverallDiabetesCategory.LowRiskNoBloodTest,
                    category: DiabetesCategory.LowRiskNoBloodTest,
                    hba1c: null
                  },
                  cholesterol: {
                    overallCategory: OverallCholesterolCategory.CompleteFailure,
                    hdlCholesterolFailureReason: 'failure_reason',
                    totalCholesterolFailureReason: 'failure_reason',
                    totalCholesterolHdlRatioFailureReason: 'failure_reason'
                  }
                }
              }
            ])
            .setResultTypes([LabTestType.Cholesterol])
            .setLabOrder(mockCholesterolLabOrder.clone().build())
            .setLabResults([
              MockLabResultsBuilder.cholesterolLabResult(null, null, null)
                .setPendingReorder(true)
                .build(),
              MockLabResultsBuilder.cholesterolLabResult(
                null,
                null,
                null
              ).build()
            ])
            .build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle(
          'Cholesterol - reorder partial failure - HDL healthy returned'
        )
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .setBiometricScores([
              {
                date: new Date().toISOString(),
                scores: {
                  diabetes: {
                    overallCategory: OverallDiabetesCategory.LowRiskNoBloodTest,
                    category: DiabetesCategory.LowRiskNoBloodTest,
                    hba1c: null
                  },
                  cholesterol: {
                    overallCategory: OverallCholesterolCategory.PartialFailure,
                    hdlCholesterol: 2,
                    hdlCholesterolCategory: HdlCholesterolCategory.Normal,
                    totalCholesterolFailureReason: 'failure_reason',
                    totalCholesterolHdlRatioFailureReason: 'failure_reason'
                  }
                }
              },
              {
                date: new Date('2024-05-01').toISOString(),
                scores: {
                  diabetes: {
                    overallCategory: OverallDiabetesCategory.LowRiskNoBloodTest,
                    category: DiabetesCategory.LowRiskNoBloodTest,
                    hba1c: null
                  },
                  cholesterol: {
                    overallCategory: OverallCholesterolCategory.CompleteFailure,
                    hdlCholesterolFailureReason: 'failure_reason',
                    totalCholesterolFailureReason: 'failure_reason',
                    totalCholesterolHdlRatioFailureReason: 'failure_reason'
                  }
                }
              }
            ])
            .setResultTypes([LabTestType.Cholesterol])
            .setLabOrder(mockCholesterolLabOrder.clone().build())
            .setLabResults([
              MockLabResultsBuilder.cholesterolLabResult(null, null, null)
                .setPendingReorder(true)
                .build(),
              MockLabResultsBuilder.cholesterolLabResult(null, 2, null).build()
            ])
            .build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle(
          'Cholesterol - reorder partial failure - total cholesterol healthy returned'
        )
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .setBiometricScores([
              {
                date: new Date().toISOString(),
                scores: {
                  diabetes: {
                    overallCategory: OverallDiabetesCategory.LowRiskNoBloodTest,
                    category: DiabetesCategory.LowRiskNoBloodTest,
                    hba1c: null
                  },
                  cholesterol: {
                    overallCategory: OverallCholesterolCategory.PartialFailure,
                    hdlCholesterolFailureReason: 'failure_reason',
                    totalCholesterol: 6,
                    totalCholesterolCategory: TotalCholesterolCategory.Normal
                  }
                }
              },
              {
                date: new Date('2024-05-01').toISOString(),
                scores: {
                  diabetes: {
                    overallCategory: OverallDiabetesCategory.LowRiskNoBloodTest,
                    category: DiabetesCategory.LowRiskNoBloodTest,
                    hba1c: null
                  },
                  cholesterol: {
                    overallCategory: OverallCholesterolCategory.CompleteFailure,
                    hdlCholesterolFailureReason: 'failure_reason',
                    totalCholesterolFailureReason: 'failure_reason',
                    totalCholesterolHdlRatioFailureReason: 'failure_reason'
                  }
                }
              }
            ])
            .setLabOrder(mockCholesterolLabOrder.clone().build())
            .setResultTypes([LabTestType.Cholesterol])
            .setLabResults([
              MockLabResultsBuilder.cholesterolLabResult(null, null, null)
                .setPendingReorder(true)
                .build(),
              MockLabResultsBuilder.cholesterolLabResult(6, null, null).build()
            ])
            .build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Cholesterol - reorder success')
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .setBiometricScores([
              {
                date: new Date().toISOString(),
                scores: {
                  diabetes: {
                    overallCategory: OverallDiabetesCategory.LowRiskNoBloodTest,
                    category: DiabetesCategory.LowRiskNoBloodTest,
                    hba1c: null
                  },
                  cholesterol: {
                    overallCategory: OverallCholesterolCategory.High,
                    hdlCholesterol: 2,
                    hdlCholesterolCategory: HdlCholesterolCategory.Normal,
                    totalCholesterol: 6,
                    totalCholesterolCategory: TotalCholesterolCategory.High,
                    totalCholesterolHdlRatio: 3,
                    totalCholesterolHdlRatioCategory:
                      TotalCholesterolHdlRatioCategory.Normal
                  }
                }
              },
              {
                date: new Date('2024-05-01').toISOString(),
                scores: {
                  diabetes: {
                    overallCategory: OverallDiabetesCategory.LowRiskNoBloodTest,
                    category: DiabetesCategory.LowRiskNoBloodTest,
                    hba1c: null
                  },
                  cholesterol: {
                    overallCategory: OverallCholesterolCategory.CompleteFailure,
                    hdlCholesterolFailureReason: 'failure_reason',
                    totalCholesterolFailureReason: 'failure_reason',
                    totalCholesterolHdlRatioFailureReason: 'failure_reason'
                  }
                }
              }
            ])
            .setLabOrder(mockCholesterolLabOrder.clone().build())
            .setResultTypes([LabTestType.Cholesterol])
            .setLabResults([
              MockLabResultsBuilder.cholesterolLabResult(null, null, null)
                .setPendingReorder(true)
                .build(),
              MockLabResultsBuilder.cholesterolLabResult(6, 2, 3).build()
            ])
            .build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Cholesterol And hba1c - reorder complete failure')
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .setBiometricScores([
              {
                date: new Date().toISOString(),
                scores: {
                  diabetes: {
                    overallCategory: OverallDiabetesCategory.CompleteFailure,
                    failureReason: 'failure_reason'
                  },
                  cholesterol: {
                    overallCategory: OverallCholesterolCategory.CompleteFailure,
                    hdlCholesterolFailureReason: 'failure_reason',
                    totalCholesterolFailureReason: 'failure_reason',
                    totalCholesterolHdlRatioFailureReason: 'failure_reason'
                  }
                }
              },
              {
                date: new Date('2024-05-01').toISOString(),
                scores: {
                  diabetes: {
                    overallCategory: OverallDiabetesCategory.CompleteFailure,
                    failureReason: 'failure_reason'
                  },
                  cholesterol: {
                    overallCategory: OverallCholesterolCategory.CompleteFailure,
                    hdlCholesterolFailureReason: 'failure_reason',
                    totalCholesterolFailureReason: 'failure_reason',
                    totalCholesterolHdlRatioFailureReason: 'failure_reason'
                  }
                }
              }
            ])
            .setLabOrder(mockBothTestsLabOrder.clone().build())
            .setResultTypes([LabTestType.Cholesterol, LabTestType.HbA1c])
            .setLabResults([
              MockLabResultsBuilder.cholesterolLabResult(null, null, null)
                .setPendingReorder(true)
                .build(),
              MockLabResultsBuilder.diabetesLabResult(null)
                .setPendingReorder(true)
                .build(),
              MockLabResultsBuilder.cholesterolLabResult(
                null,
                null,
                null
              ).build(),
              MockLabResultsBuilder.diabetesLabResult(null).build()
            ])
            .setBloodTestExpiryWritebackStatus(
              BloodTestExpiryWritebackStatus.NA
            )
            .build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle(
          'Cholesterol And hba1c - reorder partial failure - hba1c returned only'
        )
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .setBiometricScores([
              {
                date: new Date().toISOString(),
                scores: {
                  diabetes: {
                    overallCategory: OverallDiabetesCategory.Low,
                    category: DiabetesCategory.Low,
                    hba1c: 23
                  },
                  cholesterol: {
                    overallCategory: OverallCholesterolCategory.CompleteFailure,
                    hdlCholesterolFailureReason: 'failure_reason',
                    totalCholesterolFailureReason: 'failure_reason',
                    totalCholesterolHdlRatioFailureReason: 'failure_reason'
                  }
                }
              },
              {
                date: new Date('2024-05-01').toISOString(),
                scores: {
                  diabetes: {
                    overallCategory: OverallDiabetesCategory.CompleteFailure,
                    failureReason: 'failure_reason'
                  },
                  cholesterol: {
                    overallCategory: OverallCholesterolCategory.CompleteFailure,
                    hdlCholesterolFailureReason: 'failure_reason',
                    totalCholesterolFailureReason: 'failure_reason',
                    totalCholesterolHdlRatioFailureReason: 'failure_reason'
                  }
                }
              }
            ])
            .setResultTypes([LabTestType.Cholesterol, LabTestType.HbA1c])
            .setLabOrder(mockBothTestsLabOrder.clone().build())
            .setLabResults([
              MockLabResultsBuilder.cholesterolLabResult(null, null, null)
                .setPendingReorder(true)
                .build(),
              MockLabResultsBuilder.diabetesLabResult(null)
                .setPendingReorder(true)
                .build(),
              MockLabResultsBuilder.cholesterolLabResult(
                null,
                null,
                null
              ).build(),
              MockLabResultsBuilder.diabetesLabResult(23).build()
            ])
            .build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Cholesterol And hba1c - reorder success')
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .setBiometricScores([
              {
                date: new Date().toISOString(),
                scores: {
                  diabetes: {
                    overallCategory: OverallDiabetesCategory.Low,
                    category: DiabetesCategory.Low,
                    hba1c: 23
                  },
                  cholesterol: {
                    overallCategory: OverallCholesterolCategory.High,
                    hdlCholesterol: 2,
                    hdlCholesterolCategory: HdlCholesterolCategory.Normal,
                    totalCholesterol: 6,
                    totalCholesterolCategory: TotalCholesterolCategory.High,
                    totalCholesterolHdlRatio: 3,
                    totalCholesterolHdlRatioCategory:
                      TotalCholesterolHdlRatioCategory.Normal
                  }
                }
              },
              {
                date: new Date('2024-05-01').toISOString(),
                scores: {
                  diabetes: {
                    overallCategory: OverallDiabetesCategory.CompleteFailure,
                    failureReason: 'failure_reason'
                  },
                  cholesterol: {
                    overallCategory: OverallCholesterolCategory.CompleteFailure,
                    hdlCholesterolFailureReason: 'failure_reason',
                    totalCholesterolFailureReason: 'failure_reason',
                    totalCholesterolHdlRatioFailureReason: 'failure_reason'
                  }
                }
              }
            ])
            .setResultTypes([LabTestType.Cholesterol, LabTestType.HbA1c])
            .setLabOrder(mockBothTestsLabOrder.clone().build())
            .setLabResults([
              MockLabResultsBuilder.cholesterolLabResult(null, null, null)
                .setPendingReorder(true)
                .build(),
              MockLabResultsBuilder.diabetesLabResult(null)
                .setPendingReorder(true)
                .build(),
              MockLabResultsBuilder.cholesterolLabResult(6, 2, 3).build(),
              MockLabResultsBuilder.diabetesLabResult(23).build()
            ])
            .build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle(
          'Cholesterol And hba1c - first order partial failure - HDL unhealthy returned only'
        )
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .setBiometricScores([
              {
                date: new Date().toISOString(),
                scores: {
                  diabetes: {
                    overallCategory: OverallDiabetesCategory.CompleteFailure,
                    failureReason: 'failure_reason'
                  },
                  cholesterol: {
                    overallCategory: OverallCholesterolCategory.PartialFailure,
                    hdlCholesterol: 0.9,
                    hdlCholesterolCategory: HdlCholesterolCategory.Low,
                    totalCholesterolFailureReason: 'failure_reason',
                    totalCholesterolHdlRatioFailureReason: 'failure_reason'
                  }
                }
              }
            ])
            .setLabOrder(mockBothTestsLabOrder.clone().build())
            .setResultTypes([LabTestType.Cholesterol, LabTestType.HbA1c])
            .setLabResults([
              MockLabResultsBuilder.cholesterolLabResult(
                null,
                0.9,
                null
              ).build(),
              MockLabResultsBuilder.diabetesLabResult(null).build()
            ])
            .build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle(
          'Cholesterol And hba1c - first order partial failure - total cholesterol high risk returned only'
        )
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .setBiometricScores([
              {
                date: new Date().toISOString(),
                scores: {
                  diabetes: {
                    overallCategory: OverallDiabetesCategory.CompleteFailure,
                    failureReason: 'failure_reason'
                  },
                  cholesterol: {
                    overallCategory: OverallCholesterolCategory.PartialFailure,
                    hdlCholesterolFailureReason: 'failure_reason',
                    totalCholesterol: 6,
                    totalCholesterolCategory: TotalCholesterolCategory.High,
                    totalCholesterolHdlRatioFailureReason: 'failure_reason'
                  }
                }
              }
            ])
            .setLabOrder(mockBothTestsLabOrder.clone().build())
            .setResultTypes([LabTestType.Cholesterol, LabTestType.HbA1c])
            .setLabResults([
              MockLabResultsBuilder.cholesterolLabResult(6, null, null).build(),
              MockLabResultsBuilder.diabetesLabResult(null).build()
            ])
            .build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle(
          'Cholesterol And hba1c - first order partial failure - hba1c failed'
        )
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .setBiometricScores([
              {
                date: new Date().toISOString(),
                scores: {
                  diabetes: {
                    overallCategory: OverallDiabetesCategory.CompleteFailure,
                    failureReason: 'failure_reason'
                  },
                  cholesterol: {
                    overallCategory: OverallCholesterolCategory.High,
                    hdlCholesterol: 2,
                    hdlCholesterolCategory: HdlCholesterolCategory.Normal,
                    totalCholesterol: 6,
                    totalCholesterolCategory: TotalCholesterolCategory.High,
                    totalCholesterolHdlRatio: 3,
                    totalCholesterolHdlRatioCategory:
                      TotalCholesterolHdlRatioCategory.Normal
                  }
                }
              }
            ])
            .setLabOrder(mockBothTestsLabOrder.clone().build())
            .setResultTypes([LabTestType.Cholesterol, LabTestType.HbA1c])
            .setLabResults([
              MockLabResultsBuilder.cholesterolLabResult(6, 2, 3).build(),
              MockLabResultsBuilder.diabetesLabResult(null).build()
            ])
            .build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle(
          'Cholesterol And hba1c - first order partial failure - total cholesterol very high risk and hba1c returned'
        )
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .setBiometricScores([
              {
                date: new Date().toISOString(),
                scores: {
                  diabetes: {
                    overallCategory: OverallDiabetesCategory.Low,
                    category: DiabetesCategory.Low,
                    hba1c: 23
                  },
                  cholesterol: {
                    overallCategory: OverallCholesterolCategory.PartialFailure,
                    hdlCholesterolFailureReason: 'failure_reason',
                    totalCholesterol: 7.5,
                    totalCholesterolCategory: TotalCholesterolCategory.VeryHigh,
                    totalCholesterolHdlRatioFailureReason: 'failure_reason'
                  }
                }
              }
            ])
            .setLabOrder(mockBothTestsLabOrder.clone().build())
            .setResultTypes([LabTestType.Cholesterol, LabTestType.HbA1c])
            .setLabResults([
              MockLabResultsBuilder.cholesterolLabResult(
                7.5,
                null,
                null
              ).build(),
              MockLabResultsBuilder.diabetesLabResult(23).build()
            ])
            .build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle(
          'Cholesterol And hba1c - partial Normal TC cholesterol - failed hba1c'
        )
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .setBiometricScores([
              {
                date: new Date().toISOString(),
                scores: {
                  diabetes: {
                    overallCategory: OverallDiabetesCategory.CompleteFailure,
                    failureReason: 'failure_reason'
                  },
                  cholesterol: {
                    overallCategory: OverallCholesterolCategory.PartialFailure,
                    hdlCholesterolFailureReason: 'failure_reason',
                    totalCholesterol: 6,
                    totalCholesterolCategory: TotalCholesterolCategory.Normal,
                    totalCholesterolHdlRatioFailureReason: 'failure_reason'
                  }
                }
              }
            ])
            .setLabOrder(mockCholesterolLabOrder.clone().build())
            .setResultTypes([LabTestType.Cholesterol, LabTestType.HbA1c])
            .setLabResults([
              MockLabResultsBuilder.cholesterolLabResult(6, null, null).build(),
              MockLabResultsBuilder.diabetesLabResult(null).build()
            ])
            .build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle(
          'Cholesterol And hba1c - full cholesterol - failed hba1c - cvd moderate - high bp at home'
        )
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .updateQuestionnaire({
              bloodPressureDiastolic: 99,
              bloodPressureSystolic: 169,
              bloodPressureLocation: BloodPressureLocation.Monitor
            })
            .updateQuestionnaireScores({
              bloodPressureCategory: BloodPressureCategory.High
            })
            .setRiskScores({
              qRiskScore: 38,
              qRiskScoreCategory: QRiskCategory.Moderate,
              scoreCalculationDate: new Date().toISOString(),
              heartAge: 84
            })
            .setBiometricScores([
              {
                date: new Date().toISOString(),
                scores: {
                  diabetes: {
                    overallCategory: OverallDiabetesCategory.CompleteFailure,
                    failureReason: 'failure_reason'
                  },
                  cholesterol: {
                    overallCategory: OverallCholesterolCategory.Normal,
                    hdlCholesterol: 1,
                    totalCholesterol: 2,
                    totalCholesterolCategory: TotalCholesterolCategory.Normal,
                    totalCholesterolHdlRatio: 6,
                    totalCholesterolHdlRatioCategory:
                      TotalCholesterolHdlRatioCategory.Normal
                  }
                }
              }
            ])
            .setLabOrder(mockCholesterolLabOrder.clone().build())
            .setResultTypes([LabTestType.Cholesterol, LabTestType.HbA1c])
            .setLabResults([
              MockLabResultsBuilder.cholesterolLabResult(2, 1, 6).build(),
              MockLabResultsBuilder.diabetesLabResult(null).build()
            ])
            .build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle(
          'Cholesterol And hba1c - full cholesterol - failed hba1c - cvd low'
        )
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .setRiskScores({
              qRiskScore: 10.9,
              qRiskScoreCategory: QRiskCategory.Low,
              scoreCalculationDate: new Date().toISOString(),
              heartAge: 66
            })
            .setBiometricScores([
              {
                date: new Date().toISOString(),
                scores: {
                  diabetes: {
                    overallCategory: OverallDiabetesCategory.CompleteFailure,
                    failureReason: 'failure_reason'
                  },
                  cholesterol: {
                    overallCategory: OverallCholesterolCategory.Normal,
                    hdlCholesterol: 1,
                    hdlCholesterolCategory: HdlCholesterolCategory.Normal,
                    totalCholesterol: 2,
                    totalCholesterolCategory: TotalCholesterolCategory.Normal,
                    totalCholesterolHdlRatio: 6,
                    totalCholesterolHdlRatioCategory:
                      TotalCholesterolHdlRatioCategory.Normal
                  }
                }
              }
            ])
            .setLabOrder(mockCholesterolLabOrder.clone().build())
            .setResultTypes([LabTestType.Cholesterol, LabTestType.HbA1c])
            .setLabResults([
              MockLabResultsBuilder.cholesterolLabResult(2, 1, 6).build(),
              MockLabResultsBuilder.diabetesLabResult(null).build()
            ])
            .build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle(
          'Cholesterol And hba1c - full cholesterol high - failed hba1c - cvd high'
        )
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .setRiskScores({
              qRiskScore: 38.96,
              qRiskScoreCategory: QRiskCategory.High,
              scoreCalculationDate: new Date().toISOString(),
              heartAge: 66
            })
            .setBiometricScores([
              {
                date: new Date().toISOString(),
                scores: {
                  diabetes: {
                    overallCategory: OverallDiabetesCategory.CompleteFailure,
                    failureReason: 'failure_reason'
                  },
                  cholesterol: {
                    overallCategory: OverallCholesterolCategory.High,
                    hdlCholesterol: 1,
                    hdlCholesterolCategory: HdlCholesterolCategory.Normal,
                    totalCholesterol: 2,
                    totalCholesterolCategory: TotalCholesterolCategory.Normal,
                    totalCholesterolHdlRatio: 6,
                    totalCholesterolHdlRatioCategory:
                      TotalCholesterolHdlRatioCategory.Normal
                  }
                }
              }
            ])
            .setLabOrder(mockCholesterolLabOrder.clone().build())
            .setResultTypes([LabTestType.Cholesterol, LabTestType.HbA1c])
            .setLabResults([
              MockLabResultsBuilder.cholesterolLabResult(2, 1, 6).build(),
              MockLabResultsBuilder.diabetesLabResult(null).build()
            ])
            .build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle(
          'Cholesterol And hba1c - failed cholesterol - hba1c high risk'
        )
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .setBiometricScores([
              {
                date: new Date().toISOString(),
                scores: {
                  diabetes: {
                    overallCategory: OverallDiabetesCategory.AtRisk,
                    category: DiabetesCategory.AtRisk,
                    hba1c: 23
                  },
                  cholesterol: {
                    overallCategory: OverallCholesterolCategory.CompleteFailure,
                    hdlCholesterolFailureReason: 'failure_reason',
                    totalCholesterolFailureReason: 'failure_reason',
                    totalCholesterolHdlRatioFailureReason: 'failure_reason'
                  }
                }
              }
            ])
            .setLabOrder(mockBothTestsLabOrder.clone().build())
            .setResultTypes([LabTestType.Cholesterol, LabTestType.HbA1c])
            .setLabResults([
              MockLabResultsBuilder.cholesterolLabResult(
                null,
                null,
                null
              ).build(),
              MockLabResultsBuilder.diabetesLabResult(23).build()
            ])
            .build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle(
          'Cholesterol And hba1c - failed cholesterol - hba1c possible diabetes'
        )
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .setBiometricScores([
              {
                date: new Date().toISOString(),
                scores: {
                  diabetes: {
                    overallCategory: OverallDiabetesCategory.High,
                    category: DiabetesCategory.High,
                    hba1c: 45
                  },
                  cholesterol: {
                    overallCategory: OverallCholesterolCategory.CompleteFailure,
                    hdlCholesterolFailureReason: 'failure_reason',
                    totalCholesterolFailureReason: 'failure_reason',
                    totalCholesterolHdlRatioFailureReason: 'failure_reason'
                  }
                }
              }
            ])
            .setLabOrder(mockBothTestsLabOrder.clone().build())
            .setResultTypes([LabTestType.Cholesterol, LabTestType.HbA1c])
            .setLabResults([
              MockLabResultsBuilder.cholesterolLabResult(
                null,
                null,
                null
              ).build(),
              MockLabResultsBuilder.diabetesLabResult(45).build()
            ])
            .build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle(
          'Cholesterol And hba1c - failed cholesterol - hba1c possible diabetes over 86mmol/mol'
        )
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .setBiometricScores([
              {
                date: new Date().toISOString(),
                scores: {
                  diabetes: {
                    overallCategory: OverallDiabetesCategory.High,
                    category: DiabetesCategory.High,
                    hba1c: 88
                  },
                  cholesterol: {
                    overallCategory: OverallCholesterolCategory.CompleteFailure,
                    hdlCholesterolFailureReason: 'failure_reason',
                    totalCholesterolFailureReason: 'failure_reason',
                    totalCholesterolHdlRatioFailureReason: 'failure_reason'
                  }
                }
              }
            ])
            .setLabOrder(mockBothTestsLabOrder.clone().build())
            .setResultTypes([LabTestType.Cholesterol, LabTestType.HbA1c])
            .setLabResults([
              MockLabResultsBuilder.cholesterolLabResult(
                null,
                null,
                null
              ).build(),
              MockLabResultsBuilder.diabetesLabResult(88).build()
            ])
            .build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Cholesterol And hba1c - failed cholesterol - hba1c low')
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .setBiometricScores([
              {
                date: new Date().toISOString(),
                scores: {
                  diabetes: {
                    overallCategory: OverallDiabetesCategory.Low,
                    category: DiabetesCategory.Low,
                    hba1c: 10
                  },
                  cholesterol: {
                    overallCategory: OverallCholesterolCategory.CompleteFailure,
                    hdlCholesterolFailureReason: 'failure_reason',
                    totalCholesterolFailureReason: 'failure_reason',
                    totalCholesterolHdlRatioFailureReason: 'failure_reason'
                  }
                }
              }
            ])
            .setLabOrder(mockBothTestsLabOrder.clone().build())
            .setResultTypes([LabTestType.Cholesterol, LabTestType.HbA1c])
            .setLabResults([
              MockLabResultsBuilder.cholesterolLabResult(
                null,
                null,
                null
              ).build(),
              MockLabResultsBuilder.diabetesLabResult(10).build()
            ])
            .build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle(
          'Cholesterol And hba1c - failed cholesterol - hba1c low - high bp'
        )
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .updateQuestionnaire({
              bloodPressureDiastolic: 100,
              bloodPressureSystolic: 150,
              bloodPressureLocation: BloodPressureLocation.Monitor
            })
            .updateQuestionnaireScores({
              bloodPressureCategory: BloodPressureCategory.High
            })
            .setBiometricScores([
              {
                date: new Date().toISOString(),
                scores: {
                  diabetes: {
                    overallCategory: OverallDiabetesCategory.Low,
                    category: DiabetesCategory.Low,
                    hba1c: 10
                  },
                  cholesterol: {
                    overallCategory: OverallCholesterolCategory.CompleteFailure,
                    hdlCholesterolFailureReason: 'failure_reason',
                    totalCholesterolFailureReason: 'failure_reason',
                    totalCholesterolHdlRatioFailureReason: 'failure_reason'
                  }
                }
              }
            ])
            .setResultTypes([LabTestType.Cholesterol, LabTestType.HbA1c])
            .setLabOrder(mockBothTestsLabOrder.clone().build())
            .setLabResults([
              MockLabResultsBuilder.cholesterolLabResult(
                null,
                null,
                null
              ).build(),
              MockLabResultsBuilder.diabetesLabResult(10).build()
            ])
            .build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle(
          'Cholesterol And hba1c - failed cholesterol - hba1c high risk - high bp'
        )
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .updateQuestionnaire({
              bloodPressureDiastolic: 100,
              bloodPressureSystolic: 150,
              bloodPressureLocation: BloodPressureLocation.Monitor
            })
            .updateQuestionnaireScores({
              bloodPressureCategory: BloodPressureCategory.High
            })
            .setBiometricScores([
              {
                date: new Date().toISOString(),
                scores: {
                  diabetes: {
                    overallCategory: OverallDiabetesCategory.AtRisk,
                    category: DiabetesCategory.AtRisk,
                    hba1c: 23
                  },
                  cholesterol: {
                    overallCategory: OverallCholesterolCategory.CompleteFailure,
                    hdlCholesterolFailureReason: 'failure_reason',
                    totalCholesterolFailureReason: 'failure_reason',
                    totalCholesterolHdlRatioFailureReason: 'failure_reason'
                  }
                }
              }
            ])
            .setLabOrder(mockBothTestsLabOrder.clone().build())
            .setResultTypes([LabTestType.Cholesterol, LabTestType.HbA1c])
            .setLabResults([
              MockLabResultsBuilder.cholesterolLabResult(
                null,
                null,
                null
              ).build(),
              MockLabResultsBuilder.diabetesLabResult(23).build()
            ])
            .build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle(
          'Cholesterol And hba1c - failed cholesterol - hba1c possible diabetes - high bp'
        )
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .updateQuestionnaire({
              bloodPressureDiastolic: 100,
              bloodPressureSystolic: 150,
              bloodPressureLocation: BloodPressureLocation.Monitor
            })
            .updateQuestionnaireScores({
              bloodPressureCategory: BloodPressureCategory.High
            })
            .setBiometricScores([
              {
                date: new Date().toISOString(),
                scores: {
                  diabetes: {
                    overallCategory: OverallDiabetesCategory.High,
                    category: DiabetesCategory.High,
                    hba1c: 35
                  },
                  cholesterol: {
                    overallCategory: OverallCholesterolCategory.CompleteFailure,
                    hdlCholesterolFailureReason: 'failure_reason',
                    totalCholesterolFailureReason: 'failure_reason',
                    totalCholesterolHdlRatioFailureReason: 'failure_reason'
                  }
                }
              }
            ])
            .setLabOrder(mockBothTestsLabOrder.clone().build())
            .setResultTypes([LabTestType.Cholesterol, LabTestType.HbA1c])
            .setLabResults([
              MockLabResultsBuilder.cholesterolLabResult(
                null,
                null,
                null
              ).build(),
              MockLabResultsBuilder.diabetesLabResult(35).build()
            ])
            .build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle(
          'Cholesterol And hba1c - failed cholesterol - hba1c possible diabetes over 86mmol/mol - high bp'
        )
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .updateQuestionnaire({
              bloodPressureDiastolic: 100,
              bloodPressureSystolic: 150,
              bloodPressureLocation: BloodPressureLocation.Monitor
            })
            .updateQuestionnaireScores({
              bloodPressureCategory: BloodPressureCategory.High
            })
            .setBiometricScores([
              {
                date: new Date().toISOString(),
                scores: {
                  diabetes: {
                    overallCategory: OverallDiabetesCategory.High,
                    category: DiabetesCategory.High,
                    hba1c: 88
                  },
                  cholesterol: {
                    overallCategory: OverallCholesterolCategory.CompleteFailure,
                    hdlCholesterolFailureReason: 'failure_reason',
                    totalCholesterolFailureReason: 'failure_reason',
                    totalCholesterolHdlRatioFailureReason: 'failure_reason'
                  }
                }
              }
            ])
            .setLabOrder(mockBothTestsLabOrder.clone().build())
            .setResultTypes([LabTestType.Cholesterol, LabTestType.HbA1c])
            .setLabResults([
              MockLabResultsBuilder.cholesterolLabResult(
                null,
                null,
                null
              ).build(),
              MockLabResultsBuilder.diabetesLabResult(88).build()
            ])
            .build()
        )
        .build()
    );
  }
}
