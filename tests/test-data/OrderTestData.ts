export interface OrderPatient {
  family: string;
  given?: string[];
  text?: string;
  telecom: Array<{
    phone?: string;
    fax?: string;
    email?: string;
    sms?: string;
  }>;
  address: {
    line: string[];
    city?: string;
    postalCode: string;
    country?: string;
    use?: "home" | "work" | "temp" | "old" | "billing";
    type?: "postal" | "physical" | "both";
  };
  birthDate: string;
  nhsNumber: string;
}

export interface OrderPayload {
  testCode: string;
  testDescription: string;
  supplierId: string;
  patient: OrderPatient;
  consent: boolean;
}

export class OrderTestData {
  static readonly PREVENTX_SUPPLIER_ID = "c1a2b3c4-1234-4def-8abc-123456789abc";
  static readonly PREVENTX_SUPPLIER_NAME = "Preventx";

  static readonly defaultOrder: OrderPayload = {
    testCode: "31676001",
    testDescription: "HIV antigen test",
    supplierId: OrderTestData.PREVENTX_SUPPLIER_ID,
    patient: {
      family: "IntegrationTest",
      given: ["Automated"],
      text: "Automated IntegrationTest",
      telecom: [{ phone: "+447700900999" }, { email: "automated.integration@example.com" }],
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

  static getDefaultOrder(): OrderPayload {
    return structuredClone(this.defaultOrder);
  }
}
