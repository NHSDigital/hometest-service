import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import type { MockPatient, MockPatientScenario } from './model/mock-patient';
import type { MockPatientGroup } from './mock-patient-group';
import type { IHealthCheck } from '@dnhc-health-checks/shared';

export class MockDataGenerationService {
  generateMockData(mockPatientGroups: MockPatientGroup[]): void {
    mockPatientGroups.forEach((group, index) => {
      group.setGroupId(index + 1);
      group.create();
    });

    this.generateMockDataScenarios(mockPatientGroups);

    const mockPatients = mockPatientGroups.flatMap((group) => group.patients);
    this.generateMockPatientDbInserts(mockPatients);
    this.generateMockHealthCheckDbInserts(mockPatients);
    this.generateMockLabOrderDbInserts(mockPatients);
    this.generateMockLabResultsDbInserts(mockPatients);
  }

  private generateMockLabResultsDbInserts(mockPatients: MockPatient[]) {
    const mockLabResultsDbInserts = mockPatients
      .flatMap((patient) => patient.healthChecks ?? [])
      .filter((hc) => hc.labResults !== undefined)
      .flatMap((hc) => hc.labResults ?? [])
      .filter((lr) => lr !== undefined);

    this.writeJsonFile(
      join(__dirname, '../../db/nonprod/nhc-lab-result-db'),
      'generated-mock-lab-results.json',
      { inserts: mockLabResultsDbInserts }
    );
  }

  private generateMockDataScenarios(
    mockPatientGroups: MockPatientGroup[]
  ): void {
    const scenariosDir = join(__dirname, '../../mocks/generated-scenarios');
    if (existsSync(scenariosDir)) {
      rmSync(scenariosDir, { recursive: true, force: true });
    }
    mkdirSync(scenariosDir, { recursive: true });

    for (const group of mockPatientGroups) {
      const mockScenarios = this.buildMockScenarios(group.patients);
      this.writeJsonFile(
        scenariosDir,
        `${group.groupId}-${group.groupName}.json`,
        mockScenarios
      );
    }
  }

  private buildMockScenarios(
    mockPatients: MockPatient[]
  ): Record<string, MockPatientScenario> {
    return mockPatients.reduce<Record<string, MockPatientScenario>>(
      (acc, patient) => {
        acc[patient.code] = {
          title: patient.title,
          identifier: patient.id,
          nhsNumber: patient.nhsNumber,
          identityProofingLevel: patient.identityProofingLevel,
          age: patient.age,
          gpOdsCode: patient.gpOdsCode,
          usedByAutomation: patient.usedByAutomation ?? false
        };
        return acc;
      },
      {}
    );
  }

  private generateMockPatientDbInserts(mockPatients: MockPatient[]): void {
    const generateDateOfBirth = (age: string): string => {
      const currentYear = new Date().getFullYear();
      const birthYear = currentYear - parseInt(age, 10);
      return `${birthYear}-01-01`;
    };

    const mockPatientDbInserts = mockPatients
      .filter((patient) => patient.healthChecks.length > 0)
      .map((patient) => ({
        nhsNumber: patient.nhsNumber,
        acceptedTermsVersion: patient.acceptedTermsVersion,
        dateOfBirth: generateDateOfBirth(patient.age),
        gpOdsCode: patient.gpOdsCode,
        nhsLoginId: patient.nhsLoginId,
        patientId: patient.patientId
      }));

    this.writeJsonFile(
      join(__dirname, '../../db/nonprod/nhc-patient-db'),
      'generated-mock-patients.json',
      { inserts: mockPatientDbInserts }
    );
  }

  private generateMockHealthCheckDbInserts(mockPatients: MockPatient[]): void {
    const mockHealthCheckDbInserts = mockPatients
      .filter((patient) => patient.healthChecks.length > 0)
      .flatMap((patient) => patient.healthChecks ?? [])
      .filter((hc) => hc !== undefined)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .map(({ labOrders, labResults, ...rest }) => rest) as IHealthCheck[];

    this.writeJsonFile(
      join(__dirname, '../../db/nonprod/nhc-health-check-db'),
      'generated-mock-health-checks.json',
      { inserts: mockHealthCheckDbInserts }
    );
  }

  private generateMockLabOrderDbInserts(mockPatients: MockPatient[]): void {
    const mockLabOrderDbInserts = mockPatients
      .flatMap((patient) => patient.healthChecks ?? [])
      .filter((hc) => hc.labOrders !== undefined)
      .flatMap((hc) => hc.labOrders ?? [])
      .filter((lo) => lo !== undefined);

    this.writeJsonFile(
      join(__dirname, '../../db/nonprod/nhc-order-db'),
      'generated-mock-lab-orders.json',
      { inserts: mockLabOrderDbInserts }
    );
  }

  private writeJsonFile(dir: string, filename: string, data: any): void {
    mkdirSync(dir, { recursive: true });
    const filePath = join(dir, filename);
    writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }
}
