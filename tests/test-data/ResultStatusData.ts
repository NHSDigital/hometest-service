export interface Coding {
  system: string;
  code: string;
  display: string;
}

export interface CodeableConcept {
  coding: Coding[];
  text?: string;
}

export interface Reference {
  reference: string;
  display?: string;
}

export interface Identifier {
  system: string;
  value: string;
}

export interface BasedOn {
  reference: string;
  type: string;
}

export interface ResultStatus {
  resourceType: string;
  identifier: Identifier[];
  status: string;
  intent: string;
  basedOn: BasedOn[];
  requester: Reference;
  for: Reference;
  businessStatus: CodeableConcept;
  authoredOn: string;
  lastModified: string;
}

export class ResultsStatusData {
  static resultsAvailable(orderId: string, patientId: string, supplierId: string): ResultStatus {
    return {
      resourceType: "Task",
      identifier: [
        {
          system: "https://fhir.hometest.nhs.uk/Id/order-id",
          value: `${orderId}`,
        },
      ],
      status: "completed",
      intent: "order",
      basedOn: [
        {
          reference: "ServiceRequest/9da6939e-2e79-401e-837e-478970c1502d",
          type: "ServiceRequest",
        },
      ],
      requester: {
        reference: `Organization/${supplierId}`,
      },
      for: {
        reference: `Patient/${patientId}`,
      },
      businessStatus: {
        coding: [
          {
            system: "https://fhir.hometest.nhs.uk/CodeSystem/result-business-status",
            code: "result-available",
            display: "Result available to patient",
          },
        ],
        text: "result-available",
      },
      authoredOn: "2025-11-04T15:45:00Z",
      lastModified: "2026-03-30T10:00:00Z",
    };
  }
}
