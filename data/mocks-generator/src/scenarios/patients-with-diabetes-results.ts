import { MockHealthCheckBuilder } from '../builders/mock-health-check-builder';
import { MockLabOrderBuilder } from '../builders/mock-lab-order-builder';
import { MockLabResultsBuilder } from '../builders/mock-lab-results-builder';
import { MockPatientBuilder } from '../builders/mock-patient-builder';
import { MockPatientGroup } from '../mock-patient-group';
import {
  DiabetesCategory,
  HdlCholesterolCategory,
  LeicesterRiskCategory,
  OverallCholesterolCategory,
  OverallDiabetesCategory,
  TotalCholesterolCategory,
  TotalCholesterolHdlRatioCategory
} from '@dnhc-health-checks/shared/model/enum/score-categories';

export class PatientsWithDiabetesResultsMockPatientGroup extends MockPatientGroup {
  constructor() {
    super('patients-with-diabetes-results');
  }

  create(): void {
    const mockHealthCheck =
      MockHealthCheckBuilder.basicHealthCheckWithResults();
    const mockLabOrder = MockLabOrderBuilder.labOrderForBothTests();

    const totalCholesterol = 6.3;
    const hdlCholesterol = 1.5;
    const totalCholesterolHdlRatio = 5;
    const cholesterol = {
      overallCategory: OverallCholesterolCategory.High,
      totalCholesterol,
      totalCholesterolCategory: TotalCholesterolCategory.High,
      hdlCholesterol,
      hdlCholesterolCategory: HdlCholesterolCategory.Normal,
      totalCholesterolHdlRatio,
      totalCholesterolHdlRatioCategory: TotalCholesterolHdlRatioCategory.Normal
    };
    const mockCholesterolResult = MockLabResultsBuilder.cholesterolLabResult(
      totalCholesterol,
      hdlCholesterol,
      totalCholesterolHdlRatio
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Patient with low risk (no blood test)')
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .updateQuestionnaireScores({
              leicesterRiskCategory: LeicesterRiskCategory.Low,
              leicesterRiskScore: 5
            })
            .setBiometricScores([
              {
                date: new Date().toISOString(),
                scores: {
                  diabetes: {
                    overallCategory: OverallDiabetesCategory.LowRiskNoBloodTest,
                    category: DiabetesCategory.LowRiskNoBloodTest,
                    hba1c: null
                  },
                  cholesterol
                }
              }
            ])
            .setLabOrder(mockLabOrder.clone().build())
            .setLabResults([mockCholesterolResult.clone().build()])
            .build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Patient with low risk (Hba1c)')
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .updateQuestionnaireScores({
              leicesterRiskCategory: LeicesterRiskCategory.High,
              leicesterRiskScore: 16
            })
            .setBiometricScores([
              {
                date: new Date().toISOString(),
                scores: {
                  diabetes: {
                    overallCategory: OverallDiabetesCategory.Low,
                    category: DiabetesCategory.Low,
                    hba1c: 41
                  },
                  cholesterol
                }
              }
            ])
            .setLabOrder(mockLabOrder.clone().build())
            .setLabResults([
              mockCholesterolResult.clone().build(),
              MockLabResultsBuilder.diabetesLabResult(41).build()
            ])
            .build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Patient who is at risk')
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .updateQuestionnaireScores({
              leicesterRiskCategory: LeicesterRiskCategory.High,
              leicesterRiskScore: 12
            })
            .setBiometricScores([
              {
                date: new Date().toISOString(),
                scores: {
                  diabetes: {
                    overallCategory: OverallDiabetesCategory.AtRisk,
                    category: DiabetesCategory.AtRisk,
                    hba1c: 45
                  },
                  cholesterol
                }
              }
            ])
            .setLabOrder(mockLabOrder.clone().build())
            .setLabResults([
              mockCholesterolResult.clone().build(),
              MockLabResultsBuilder.diabetesLabResult(45).build()
            ])
            .build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Patient who is at high risk')
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .updateQuestionnaireScores({
              leicesterRiskCategory: LeicesterRiskCategory.High,
              leicesterRiskScore: 12
            })
            .setBiometricScores([
              {
                date: new Date().toISOString(),
                scores: {
                  diabetes: {
                    overallCategory: OverallDiabetesCategory.High,
                    category: DiabetesCategory.High,
                    hba1c: 49
                  },
                  cholesterol
                }
              }
            ])
            .setLabOrder(mockLabOrder.clone().build())
            .setLabResults([
              mockCholesterolResult.clone().build(),
              MockLabResultsBuilder.diabetesLabResult(49).build()
            ])
            .build()
        )
        .build()
    );
  }
}
