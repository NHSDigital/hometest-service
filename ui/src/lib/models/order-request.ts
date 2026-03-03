export interface PatientContact {
  phone?: string;
  sms?: string;
  email?: string;
}

export interface PatientAddress {
  line: string[];
  city: string;
  postalCode: string;
  country: string;
}

export interface Patient {
  family: string;
  given: string[];
  text: string;
  telecom: PatientContact[];
  address: PatientAddress;
  birthDate: string;
  nhsNumber: string;
}

export interface CreateOrderRequest {
  testCode: string;
  testDescription: string;
  supplierId: string;
  patient: Patient;
  consent: boolean;
}
