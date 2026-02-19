import {
  Bundle,
  BundleEntry,
  CodeableConcept,
  Extension,
  Identifier,
  Patient,
  Reference,
  ServiceRequest,
} from "fhir/r4";

import { TestResult } from "src/lib/db/test-result-db-client";

const requesterId = "ORG001";

export class ObservationBuilder {
  public static build(testResult: TestResult): Bundle {
    //todo change to build proper obervation
    const serviceRequest = this.buildServiceRequest(testResult);
    const bundleEntry = this.buildBundleEntry(testResult, serviceRequest);

    return {
      resourceType: "Bundle",
      type: "searchset",
      total: 1,
      entry: [bundleEntry],
    };
  }

  private static buildIdentifier(testResult: TestResult): Identifier {
    return {
      system: "https://fhir.hometest.nhs.uk/Id/order-id",
      value: `${testResult.reference_number}`,
    };
  }

  private static buildPerformer(testResult: TestResult): Reference {
    return {
      reference: `Organization/${testResult.supplier_id}`,
      type: "Organization",
      display: testResult.supplier_name,
    };
  }

  private static buildCode(): CodeableConcept {
    return {
      coding: [
        {
          system: "http://snomed.info/sct",
          code: "31676001",
          display: "HIV antigen test",
        },
      ],
      text: "HIV antigen test",
    };
  }

  private static buildRequester(): Reference {
    return {
      reference: `Organization/${requesterId}`,
    };
  }

  private static buildBusinessStatusExtension(
    testResult: TestResult,
  ): Extension {
    return {
      url: "https://fhir.hometest.nhs.uk/StructureDefinition/business-status",
      extension: [
        {
          url: "timestamp",
          valueDate: testResult.status_created_at.toISOString().split("T")[0],
        },
      ],
      valueCodeableConcept: {
        coding: [
          {
            system:
              "https://fhir.hometest.nhs.uk/CodeSystem/order-business-status",
            code: testResult.status_code,
            display: testResult.status_description,
          },
        ],
        text: testResult.status_code,
      },
    };
  }

  private static buildPatient(testResult: TestResult): Patient {
    return {
      resourceType: "Patient",
      id: "patient-1",
      identifier: [
        {
          system: "https://fhir.nhs.uk/Id/nhs-number",
          value: testResult.patient_nhs_number,
          use: "official",
        },
      ],
      birthDate: testResult.patient_birth_date.toISOString().split("T")[0],
    };
  }

  private static buildServiceRequest(testResult: TestResult): ServiceRequest {
    return {
      resourceType: "ServiceRequest",
      id: testResult.id,
      identifier: [this.buildIdentifier(testResult)],
      status: testResult.status_code === "COMPLETE" ? "completed" : "active",
      intent: "order",
      code: this.buildCode(),
      subject: {
        reference: "#patient-1",
      },
      requester: this.buildRequester(),
      performer: [this.buildPerformer(testResult)],
      authoredOn: testResult.created_at.toISOString(),
      extension: [this.buildBusinessStatusExtension(testResult)],
      contained: [this.buildPatient(testResult)],
    };
  }

  private static buildBundleEntry(
    order: TestResult,
    serviceRequest: ServiceRequest,
  ): BundleEntry {
    return {
      fullUrl: `urn:uuid:${order.id}`,
      resource: serviceRequest,
    };
  }
}
