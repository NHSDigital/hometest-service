import type { MockPatient } from './model/mock-patient';

export abstract class MockPatientGroup {
  groupId: number;
  groupName: string;
  patients: MockPatient[];
  public static readonly PLACEHOLDER = 'to-be-calculated';

  constructor(groupName: string) {
    this.groupName = groupName;
    this.patients = [];
  }

  setGroupId(groupId: number): void {
    this.groupId = groupId;
  }

  abstract create(): void;

  addPatient(patient: MockPatient): void {
    const patientGroupIndex = this.patients.length + 1;

    // generate nhs number
    const groupIdStr = this.groupId.toString().padStart(3, '0');
    const patientIndexStr = patientGroupIndex.toString().padStart(7, '0');
    patient.nhsNumber = `${groupIdStr}${patientIndexStr}`;
    patient.patientId = MockPatientGroup.generatePatientId(
      this.groupId,
      patientGroupIndex
    );
    patient.id = `${this.groupId}-${patientGroupIndex}`;

    // generate health check ids
    // assumption: only one health check per patient
    patient.healthChecks?.forEach((healthCheck) => {
      healthCheck.id = `hc-${patient.nhsNumber}`;
      healthCheck.patientId = patient.patientId;
      healthCheck.nhsNumber = patient.nhsNumber;

      // generate lab order ids within health check
      // assumption: only one lab order per health check
      healthCheck.labOrders?.forEach((labOrder) => {
        labOrder.id = `lo-${patient.nhsNumber}-1`;
        labOrder.fulfilmentOrderId =
          labOrder.fulfilmentOrderId === MockPatientGroup.PLACEHOLDER
            ? `fo-${patient.nhsNumber}-1`
            : undefined;
        labOrder.healthCheckId = healthCheck.id;
      });

      // generate lab result ids within health check
      // assumption: lab results belong to the lab order above
      healthCheck.labResults?.forEach((labResult) => {
        labResult.orderId = `lo-${patient.nhsNumber}-1`;
        labResult.fulfilmentOrderId = `fo-${patient.nhsNumber}-1`;
        labResult.healthCheckId = healthCheck.id;
        labResult.patientId = patient.patientId;
      });
    });

    this.patients.push(patient);
  }

  /**
   * Generates a UUID in the format <groupId>-0000-0000-0000-<patientGroupIndex>
   * example 00000004-0000-0000-0000-000000000001
   * This ensures that when patients are re-generated, they retain the same patientId
   */
  private static generatePatientId(
    groupId: number,
    patientGroupIndex: number
  ): string {
    const firstSection = String(groupId).padStart(8, '0').substring(0, 8);
    const lastSection = String(patientGroupIndex)
      .padStart(12, '0')
      .substring(0, 12);
    return `${firstSection}-0000-0000-0000-${lastSection}`;
  }
}
