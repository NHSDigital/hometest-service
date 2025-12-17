import { MockHealthCheckBuilder } from '../builders/mock-health-check-builder';
import { MockPatientBuilder } from '../builders/mock-patient-builder';
import { MockPatientGroup } from '../mock-patient-group';

export class PatientsWithCompletedSectionsMockPatientGroup extends MockPatientGroup {
  constructor() {
    super('patients-with-completed-sections');
  }

  create(): void {
    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Patient with eligibility section completed')
        .addHealthCheck(
          MockHealthCheckBuilder.healthCheckPassedCheckEligibilitySection().build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Patient with about you section completed')
        .addHealthCheck(
          MockHealthCheckBuilder.healthCheckPassedAboutYouSection().build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Patient with physical activity section completed')
        .addHealthCheck(
          MockHealthCheckBuilder.healthCheckPassedPhysicalActivitySection().build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Patient with alcohol consumption section completed')
        .addHealthCheck(
          MockHealthCheckBuilder.healthCheckPassedAlcoholConsumptionSection().build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Patient with enter body measurements section completed')
        .addHealthCheck(
          MockHealthCheckBuilder.healthCheckPassedEnterBodyMeasurementsSection().build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Patient with blood pressure section completed')
        .addHealthCheck(
          MockHealthCheckBuilder.healthCheckPassedBloodPressureSection().build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Patient with completed questionnaire')
        .addHealthCheck(
          MockHealthCheckBuilder.healthCheckQuestionnaireCompleted().build()
        )
        .build()
    );
  }
}
