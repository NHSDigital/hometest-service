import type { IMockHealthCheck } from './mock-health-check';

export interface MockPatient {
  id: string;
  nhsNumber: string;
  code: string;
  title: string;
  identityProofingLevel: string;
  age: string;
  gpOdsCode: string;
  acceptedTermsVersion: string;
  patientId: string;
  nhsLoginId: string;
  healthChecks: IMockHealthCheck[];
  usedByAutomation: boolean;
}

export interface MockPatientScenario {
  title: string;
  identifier: string;
  nhsNumber: string;
  identityProofingLevel: string;
  age: string;
  gpOdsCode: string;
  usedByAutomation: boolean;
}
