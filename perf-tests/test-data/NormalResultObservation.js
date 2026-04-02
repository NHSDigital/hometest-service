export function buildNormalResultObservation(orderId, patientId, supplierId) {
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
    effectiveDateTime: new Date().toISOString(),
    issued: new Date().toISOString(),
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
