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

export interface HIVObservation {
  resourceType: "Observation";
  id: string;
  basedOn: Reference[];
  status: string;
  code: CodeableConcept;
  subject: Reference;
  effectiveDateTime: string;
  issued: string;
  performer: Reference[];
  valueCodeableConcept: CodeableConcept;
  interpretation: CodeableConcept[];
}

export class ResultsObservationData {
  static buildNormalObservation(
    orderId: string,
    patientId: string,
    supplierId: string,
  ): HIVObservation {
    return {
      resourceType: "Observation",
      id: "550e8400-e29b-41d4-a716-446655440001",
      basedOn: [
        {
          reference: `ServiceRequest/${orderId}`,
        },
      ],
      status: "final",
      code: {
        coding: [
          {
            system: "http://snomed.info/sct",
            code: "31676001",
            display: "HIV antigen test",
          },
        ],
        text: "HIV antigen test",
      },
      subject: {
        reference: `Patient/${patientId}`,
      },
      effectiveDateTime: "2025-11-04T15:45:00Z",
      issued: "2025-11-04T16:00:00Z",
      performer: [
        {
          reference: `Organization/${supplierId}`,
          display: "Supplier Organization",
        },
      ],
      valueCodeableConcept: {
        coding: [
          {
            system: "http://snomed.info/sct",
            code: "260415000",
            display: "Not detected",
          },
        ],
      },
      interpretation: [
        {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
              code: "N",
              display: "Normal",
            },
          ],
        },
      ],
    };
  }

  static buildAbnormalObservation(
    orderId: string,
    patientId: string,
    supplierId: string,
  ): HIVObservation {
    return {
      resourceType: "Observation",
      id: "550e8400-e29b-41d4-a716-446655440001",
      basedOn: [
        {
          reference: `ServiceRequest/${orderId}`,
        },
      ],
      status: "final",
      code: {
        coding: [
          {
            system: "http://snomed.info/sct",
            code: "31676001",
            display: "HIV antigen test",
          },
        ],
        text: "HIV antigen test",
      },
      subject: {
        reference: `Patient/${patientId}`,
      },
      effectiveDateTime: "2025-11-04T15:45:00Z",
      issued: "2025-11-04T16:00:00Z",
      performer: [
        {
          reference: `Organization/${supplierId}`,
          display: "Supplier Organization",
        },
      ],
      valueCodeableConcept: {
        coding: [
          {
            system: "http://snomed.info/sct",
            code: "260415000",
            display: "Detected",
          },
        ],
      },
      interpretation: [
        {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
              code: "A",
              display: "Abnormal",
            },
          ],
        },
      ],
    };
  }
}
