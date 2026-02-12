export interface Coding {
  system: string;
  code: string;
  display: string;
}

export interface Interpretation {
  coding: Coding[];
}

export interface Reference {
  reference: string;
}

export interface HIVTestResult {
  basedOn: Reference[];
  subject: Reference;
  interpretation: Interpretation[];
}

export class HIVTestResultData {
  static readonly defaultResult: HIVTestResult = {
    basedOn: [
      {
        reference: "ServiceRequest/550e8400-e29b-41d4-a716-446655440000"
      }
    ],
    subject: {
      reference: "Patient/123e4567-e89b-12d3-a456-426614174000"
    },
    interpretation: [
      {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
            code: "N",
            display: "Normal"
          }
        ]
      }
    ]
  };

  static getDefaultResult(): HIVTestResult {
    return this.defaultResult;
  }

}
