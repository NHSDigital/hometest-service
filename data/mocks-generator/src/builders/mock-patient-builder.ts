import type { MockPatient } from '../model/mock-patient';
import type { IMockHealthCheck } from '../model/mock-health-check';

export class MockPatientBuilder {
  private readonly patient: Partial<MockPatient> = {};

  constructor() {
    this.patient.nhsLoginId = 'mock-sub';
    this.patient.usedByAutomation = false;
    this.patient.healthChecks = [];
  }

  setCode(code: string): this {
    this.patient.code = code;
    return this;
  }

  setTitle(title: string): this {
    this.patient.title = title;
    this.patient.code = `mock_code_${title
      .toLowerCase()
      .replace(/[-() ]/g, '_')
      .replace(/_+/g, '_')
      .replace(/_$/, '')}`;
    return this;
  }

  setIdentityProofingLevel(level: string): this {
    this.patient.identityProofingLevel = level;
    return this;
  }

  setAge(age: string): this {
    this.patient.age = age;
    return this;
  }

  setGpOdsCode(gpOdsCode: string): this {
    this.patient.gpOdsCode = gpOdsCode;
    return this;
  }

  setAcceptedTermsVersion(version: string): this {
    this.patient.acceptedTermsVersion = version;
    return this;
  }

  addHealthCheck(healthCheck: IMockHealthCheck): this {
    healthCheck.ageAtStart = parseInt(this.patient.age ?? '50');
    if (healthCheck.questionnaireCompletionDate) {
      healthCheck.ageAtCompletion = parseInt(this.patient.age ?? '50');
    }
    this.patient.healthChecks ??= [];
    this.patient.healthChecks.push(healthCheck);
    return this;
  }

  setUsedByAutomation(usedByAutomation: boolean): this {
    this.patient.usedByAutomation = usedByAutomation;
    return this;
  }

  build(): MockPatient {
    return this.patient as MockPatient;
  }

  static basicEligiblePatient(): MockPatientBuilder {
    return new MockPatientBuilder()
      .setIdentityProofingLevel('P9')
      .setGpOdsCode('mock_enabled_code')
      .setAge('50')
      .setAcceptedTermsVersion('1.0');
  }
}
