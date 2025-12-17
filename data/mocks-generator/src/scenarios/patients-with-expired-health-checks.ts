import { MockHealthCheckBuilder } from '../builders/mock-health-check-builder';
import { MockPatientBuilder } from '../builders/mock-patient-builder';
import { MockPatientGroup } from '../mock-patient-group';

import { HealthCheckSteps } from '@dnhc-health-checks/shared';

export class PatientsWithExpiredHealthChecks extends MockPatientGroup {
  constructor() {
    super('patients-with-expired-health-checks');
  }

  create(): void {
    const twentyNineDaysAgo = new Date();
    twentyNineDaysAgo.setDate(twentyNineDaysAgo.getDate() - 29);

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle(
          'Expired Health Check - Init Step - 29 Days Old - No sections submitted'
        )
        .addHealthCheck(
          MockHealthCheckBuilder.basicHealthCheck()
            .clone()
            .setCreatedAt(twentyNineDaysAgo.toISOString())
            .setStep(HealthCheckSteps.INIT)
            .build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle(
          'Expired Health Check - Init Step - 29 Days Old - Physical Activity submitted'
        )
        .addHealthCheck(
          MockHealthCheckBuilder.healthCheckPassedPhysicalActivitySection()
            .clone()
            .setCreatedAt(twentyNineDaysAgo.toISOString())
            .setStep(HealthCheckSteps.INIT)
            .build()
        )
        .build()
    );
  }
}
