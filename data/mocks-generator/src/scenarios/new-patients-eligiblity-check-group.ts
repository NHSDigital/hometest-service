import { MockPatientGroup } from '../mock-patient-group';
import { MockPatientBuilder } from '../builders/mock-patient-builder';

export class NewPatientsForEligiblityChecksMockPatientGroup extends MockPatientGroup {
  constructor() {
    super('new-patients-for-eligibility-checks');
  }

  create(): void {
    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Eligible patient - upper age boundary (74 years)')
        .setAge('74')
        .build()
    );
    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle(
          'Eligible patient - upper boundary (day before 75th birthday)'
        )
        .setAge('75-1d')
        .setUsedByAutomation(true)
        .build()
    );
    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Ineligible patient - underage (day before 40th birthday)')
        .setAge('40-1d')
        .setUsedByAutomation(true)
        .build()
    );
    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Ineligible patient - underage (35 years)')
        .setAge('35')
        .setUsedByAutomation(true)
        .build()
    );
    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Ineligible patient - insufficient proofing level')
        .setIdentityProofingLevel('P5')
        .setAge('45')
        .setUsedByAutomation(true)
        .build()
    );
    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Ineligible patient - overage (75 years)')
        .setAge('75')
        .setUsedByAutomation(true)
        .build()
    );
    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Ineligible patient - overage (80 years)')
        .setAge('80')
        .setUsedByAutomation(true)
        .build()
    );
    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Ineligible patient - ods code disabled')
        .setGpOdsCode('mock_disabled_code')
        .setAge('45')
        .setUsedByAutomation(true)
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Ineligible patient - nhs number disabled')
        .setAge('45')
        .setUsedByAutomation(true)
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Patient ineligible due to sub claim not matching')
        .setAge('45')
        .setUsedByAutomation(true)
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Patient for logout API test')
        .setAge('45')
        .setUsedByAutomation(true)
        .build()
    );
  }
}
