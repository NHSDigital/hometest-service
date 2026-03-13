export class FhirConstants {
  static readonly FHIR_BASE_URL = "https://fhir.hometest.nhs.uk";

  static readonly OBSERVATION_INTERPRETATION_SYSTEM =
    "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation";
  static readonly NORMAL_OBSERVATION_CODE = "N";

  static readonly ORDER_ID_SYSTEM = `${this.FHIR_BASE_URL}/Id/order-id`;
  static readonly ORDER_BUSINESS_STATUS_SYSTEM = `${this.FHIR_BASE_URL}/CodeSystem/order-business-status`;

  static readonly BUSINESS_STATUS_EXTENSION_URL = `${this.FHIR_BASE_URL}/StructureDefinition/business-status`;
  static readonly TIMESTAMP_EXTENSION_URL = "timestamp";
}
