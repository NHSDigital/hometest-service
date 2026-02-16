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

import { Order } from "../lib/db/db-clients/order-db-client";

const requesterId = "ORG001";

export class OrderBundleBuilder {
  public static buildBundle(order: Order): Bundle {
    const serviceRequest = this.buildServiceRequest(order);
    const bundleEntry = this.buildBundleEntry(order, serviceRequest);

    return {
      resourceType: "Bundle",
      type: "searchset",
      total: 1,
      entry: [bundleEntry],
    };
  }

  private static buildIdentifier(order: Order): Identifier {
    return {
      system: "https://fhir.hometest.nhs.uk/Id/order-id",
      value: `${order.referenceNumber}`,
    };
  }

  private static buildPerformer(order: Order): Reference {
    return {
      reference: `Organization/${order.supplierId}`,
      type: "Organization",
      display: order.supplierName,
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

  private static buildBusinessStatusExtension(order: Order): Extension {
    return {
      url: "https://fhir.hometest.nhs.uk/StructureDefinition/business-status",
      extension: [
        {
          url: "timestamp",
          valueDate: new Date(order.statusDate).toISOString().split("T")[0],
        },
      ],
      valueCodeableConcept: {
        coding: [
          {
            system:
              "https://fhir.hometest.nhs.uk/CodeSystem/order-business-status",
            code: order.statusCode,
            display: order.statusDescription,
          },
        ],
        text: order.statusCode,
      },
    };
  }

  private static buildPatient(order: Order): Patient {
    return {
      resourceType: "Patient",
      id: "patient-1",
      identifier: [
        {
          system: "https://fhir.nhs.uk/Id/nhs-number",
          value: order.nhsNumber,
          use: "official",
        },
      ],
      birthDate: order.birthDate.toISOString().split("T")[0],
    };
  }

  private static buildServiceRequest(order: Order): ServiceRequest {
    return {
      resourceType: "ServiceRequest",
      id: order.id,
      identifier: [this.buildIdentifier(order)],
      status: order.statusCode === "COMPLETE" ? "completed" : "active",
      intent: "order",
      code: this.buildCode(),
      subject: {
        reference: "#patient-1",
      },
      requester: this.buildRequester(),
      performer: [this.buildPerformer(order)],
      authoredOn: new Date(order.createdAt).toISOString(),
      extension: [this.buildBusinessStatusExtension(order)],
      contained: [this.buildPatient(order)],
    };
  }

  private static buildBundleEntry(
    order: Order,
    serviceRequest: ServiceRequest,
  ): BundleEntry {
    return {
      fullUrl: `urn:uuid:${order.id}`,
      resource: serviceRequest,
    };
  }
}
