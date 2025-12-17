import { MockPatientGroup } from '../mock-patient-group';
import { MockPatientBuilder } from '../builders/mock-patient-builder';

export class NewPatientsMockPatientGroup extends MockPatientGroup {
  constructor() {
    super('new-patients');
  }

  create(): void {
    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Eligible patient 1')
        .setAge('50')
        .setUsedByAutomation(true)
        .build()
    );
    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Eligible patient 2')
        .setAge('45')
        .setUsedByAutomation(true)
        .build()
    );
    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Eligible patient 3')
        .setAge('45')
        .setUsedByAutomation(true)
        .build()
    );
    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Eligible patient 4')
        .setAge('45')
        .setUsedByAutomation(true)
        .build()
    );
    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Eligible patient 5')
        .setAge('45')
        .setUsedByAutomation(true)
        .build()
    );
    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Eligible patient 6')
        .setAge('45')
        .setUsedByAutomation(true)
        .build()
    );
    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Eligible patient 7')
        .setAge('45')
        .setUsedByAutomation(true)
        .build()
    );
  }
}
