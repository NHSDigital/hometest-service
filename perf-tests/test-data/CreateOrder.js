export const createOrderBody = {
  testCode: "31676001",
  testDescription: "HIV antigen test",
  supplierId: "c1a2b3c4-1234-4def-8abc-123456789abc",
  patient: {
    family: "IntegrationTest",
    given: ["Automated"],
    text: "Automated IntegrationTest",
    telecom: [
      {
        phone: "+447700900999",
      },
      {
        email: "automated.integration@example.com",
      },
    ],
    address: {
      line: ["1 Integration Street"],
      city: "London",
      postalCode: "SW1A 1AA",
      country: "United Kingdom",
      use: "home",
      type: "both",
    },
    birthDate: "1990-06-15",
    nhsNumber: "9000000001",
  },
  consent: true,
};

export function buildCreateOrderPayload(params) {
  return {
    ...createOrderBody,
    supplierId: params.supplierId,
    patient: {
      ...createOrderBody.patient,
      birthDate: params.birthDate,
      nhsNumber: params.nhsNumber,
    },
  };
}
