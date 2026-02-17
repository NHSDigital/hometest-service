export interface Coding {
  system: string;
  code: string;
  display: string;
}

export interface Interpretation {
  coding: Coding[];
  text: string;
}

export interface Reference {
  reference: string;
}

export interface ValueCodeableConcept {
  coding: Coding[];
}

export interface HIVTestResult {
  resourceType: string;
  identifier: string;
  status: string;
  basedOn: Reference[];
  subject: Reference;
  interpretation: Interpretation[];
  valueCodeableConcept: ValueCodeableConcept;
}

export class HIVTestResultData {
  static readonly defaultResult: HIVTestResult = {
    resourceType: 'Observation',
    identifier: '12345',
    status: 'final',
    basedOn: [
      {
        reference: 'ServiceRequest/550e8400-e29b-41d4-a716-446655440000',
      },
    ],
    subject: {
      reference: 'Patient/123e4567-e89b-12d3-a456-426614174000',
    },
    interpretation: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
            code: 'N',
            display: 'Normal',
          },
        ],
        text: 'Normal',
      },
    ],
    valueCodeableConcept: {
      coding: [
        {
          system: 'http://snomed.info/sct',
          code: '260415000',
          display: 'Not detected',
        },
      ],
    },
  };

  static getDefaultResult(): HIVTestResult {
    return this.defaultResult;
  }
}
