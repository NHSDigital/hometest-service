import {
  DataModelVersion,
  MockHealthCheckBuilder
} from '../builders/mock-health-check-builder';
import { MockPatientBuilder } from '../builders/mock-patient-builder';
import { MockPatientGroup } from '../mock-patient-group';

export class PatientsWithDataModelVersionOutdatedMockPatientGroup extends MockPatientGroup {
  constructor() {
    super('patients-with-data-model-version-outdated');
  }

  create(): void {
    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle(
          'Patient with blood pressure section completed and outdated dataModelVersion 1.0.0'
        )
        .addHealthCheck(
          MockHealthCheckBuilder.healthCheckPassedBloodPressureSection()
            .setDataModelVersion(DataModelVersion.V1_0_0)
            .build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle(
          'Patient with blood pressure section completed and outdated dataModelVersion 2.1.0'
        )
        .addHealthCheck(
          MockHealthCheckBuilder.healthCheckPassedBloodPressureSection()
            .setDataModelVersion(DataModelVersion.V2_1_0)
            .build()
        )
        .build()
    );
  }
}
