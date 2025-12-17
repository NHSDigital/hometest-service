import { BloodPressureLocation } from '@dnhc-health-checks/shared/model/enum/health-check-answers';
import { MockHealthCheckBuilder } from '../builders/mock-health-check-builder';
import { MockPatientBuilder } from '../builders/mock-patient-builder';
import { MockPatientGroup } from '../mock-patient-group';
import { BloodPressureCategory } from '@dnhc-health-checks/shared/model/enum/score-categories';

export class PatientsWithBloodPressureResultsMockPatientGroup extends MockPatientGroup {
  constructor() {
    super('patients-with-blood-pressure-results');
  }

  create(): void {
    const mockHealthCheck =
      MockHealthCheckBuilder.basicHealthCheckWithResults();

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Patient with low blood pressure results - home')
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .updateQuestionnaire({
              bloodPressureDiastolic: 60,
              bloodPressureLocation: BloodPressureLocation.Monitor,
              bloodPressureSystolic: 80,
              lowBloodPressureValuesConfirmed: true,
              hasStrongLowBloodPressureSymptoms: false
            })
            .updateQuestionnaireScores({
              bloodPressureCategory: BloodPressureCategory.Low
            })
            .build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Patient with healthy blood pressure results - home')
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .updateQuestionnaire({
              bloodPressureDiastolic: 60,
              bloodPressureLocation: BloodPressureLocation.Monitor,
              bloodPressureSystolic: 120
            })
            .updateQuestionnaireScores({
              bloodPressureCategory: BloodPressureCategory.Healthy
            })
            .build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Patient with slightly raised blood pressure results - home')
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .updateQuestionnaire({
              bloodPressureDiastolic: 81,
              bloodPressureLocation: BloodPressureLocation.Monitor,
              bloodPressureSystolic: 121
            })
            .updateQuestionnaireScores({
              bloodPressureCategory: BloodPressureCategory.SlightlyRaised
            })
            .build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Patient with high blood pressure results - home')
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .updateQuestionnaire({
              bloodPressureDiastolic: 99,
              bloodPressureLocation: BloodPressureLocation.Monitor,
              bloodPressureSystolic: 169
            })
            .updateQuestionnaireScores({
              bloodPressureCategory: BloodPressureCategory.High
            })
            .build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Patient with low blood pressure results - pharmacy')
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .updateQuestionnaire({
              bloodPressureDiastolic: 59,
              bloodPressureLocation: BloodPressureLocation.Pharmacy,
              bloodPressureSystolic: 89
            })
            .updateQuestionnaireScores({
              bloodPressureCategory: BloodPressureCategory.Low
            })
            .build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Patient with healthy blood pressure results - pharmacy')
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .updateQuestionnaire({
              bloodPressureDiastolic: 70,
              bloodPressureLocation: BloodPressureLocation.Pharmacy,
              bloodPressureSystolic: 100
            })
            .updateQuestionnaireScores({
              bloodPressureCategory: BloodPressureCategory.Healthy
            })
            .build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle(
          'Patient with slightly raised blood pressure results - pharmacy'
        )
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .updateQuestionnaire({
              bloodPressureDiastolic: 81,
              bloodPressureLocation: BloodPressureLocation.Pharmacy,
              bloodPressureSystolic: 121
            })
            .updateQuestionnaireScores({
              bloodPressureCategory: BloodPressureCategory.SlightlyRaised
            })
            .build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Patient with high blood pressure results - pharmacy')
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .updateQuestionnaire({
              bloodPressureDiastolic: 90,
              bloodPressureLocation: BloodPressureLocation.Pharmacy,
              bloodPressureSystolic: 140
            })
            .updateQuestionnaireScores({
              bloodPressureCategory: BloodPressureCategory.High
            })
            .build()
        )
        .build()
    );
  }
}
