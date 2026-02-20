export interface OrderServiceTelecom {
  phone?: string;
  fax?: string;
  email?: string;
  pager?: string;
  url?: string;
  sms?: string;
  other?: string;
}

export interface OrderServicePatient {
  family: string;
  given?: string[];
  text?: string;
  telecom: OrderServiceTelecom[];
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

export interface OrderServiceRequest {
  testCode: string;
  testDescription: string;
  supplierId: string;
  patient: OrderServicePatient;
  consent: boolean;
}
