import { MockHealthCheckBuilder } from '../builders/mock-health-check-builder';
import { MockLabOrderBuilder } from '../builders/mock-lab-order-builder';
import { MockPatientBuilder } from '../builders/mock-patient-builder';
import { MockPatientGroup } from '../mock-patient-group';

export class PatientsWithFailedAPICallsMockPatientGroup extends MockPatientGroup {
  constructor() {
    super('patients-with-failed-api-calls');
  }

  create(): void {
    const mockHealthCheck =
      MockHealthCheckBuilder.healthCheckQuestionnaireCompleted();

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle(
          'Lab Order API - Patient for whom Thriva request fails with 400 HTTP code'
        )
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .setLabOrder(MockLabOrderBuilder.basicLabOrderNotPlaced().build())
            .build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle(
          'EMIS API - Patient for whom EMIS File Record request fails with 500 HTTP code'
        )
        .addHealthCheck(mockHealthCheck.clone().setQuestionnaire({}).build())
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle(
          'EMIS API - Patient for whom EMIS File Record request fails with 200 HTTP code'
        )
        .addHealthCheck(mockHealthCheck.clone().setQuestionnaire({}).build())
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setGpOdsCode('mock_emis_err_500_code')
        .setTitle(
          'EMIS API - Patient for whom EMIS Get Active Users request fails with 500 HTTP code'
        )
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .setQuestionnaire({})
            .setQuestionnaireScores({})
            .setBiometricScores([
              { date: new Date().toISOString(), scores: {} }
            ])
            .build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setGpOdsCode('mock_emis_err_200_code')
        .setTitle(
          'EMIS API - Patient for whom EMIS Get Active Users request fails with 200 HTTP code'
        )
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .setQuestionnaire({})
            .setQuestionnaireScores({})
            .setBiometricScores([
              { date: new Date().toISOString(), scores: {} }
            ])
            .build()
        )
        .build()
    );
  }
}
