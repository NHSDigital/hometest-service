import { Bundle, ServiceRequest } from "fhir/r4";

import { OrderDetailsMapper } from "@/lib/mappers/order-details-mapper";
import { OrderStatus } from "@/lib/models/order-details";

const BUSINESS_STATUS_EXTENSION_URL =
  "https://fhir.hometest.nhs.uk/StructureDefinition/business-status";
const ORDER_BUSINESS_STATUS_SYSTEM =
  "https://fhir.hometest.nhs.uk/CodeSystem/order-business-status";
const ORDER_ID_SYSTEM = "https://fhir.hometest.nhs.uk/Id/order-id";

function createBundle(statusCode: string, overrides?: Partial<ServiceRequest>): Bundle {
  const serviceRequest: ServiceRequest = {
    resourceType: "ServiceRequest",
    id: "test-order-id",
    status: statusCode === "COMPLETE" ? "completed" : "active",
    intent: "order",
    authoredOn: "2026-01-15T10:30:00Z",
    subject: { reference: "#patient-1" },
    identifier: [{ system: ORDER_ID_SYSTEM, value: "12345" }],
    performer: [{ display: "Test Supplier Ltd" }],
    extension: [
      {
        url: BUSINESS_STATUS_EXTENSION_URL,
        extension: [{ url: "timestamp", valueDate: "2026-01-16" }],
        valueCodeableConcept: {
          coding: [
            {
              system: ORDER_BUSINESS_STATUS_SYSTEM,
              code: statusCode,
              display: `${statusCode} description`,
            },
          ],
        },
      },
    ],
    ...overrides,
  };

  return {
    resourceType: "Bundle",
    type: "searchset",
    total: 1,
    entry: [{ fullUrl: "urn:uuid:test-order-id", resource: serviceRequest }],
  };
}

describe("OrderDetailsMapper", () => {
  describe("extractStatus - processing status mapping", () => {
    it.each(["GENERATED", "QUEUED", "SUBMITTED"])("should map %s to PROCESSING", (statusCode) => {
      const bundle = createBundle(statusCode);
      const result = OrderDetailsMapper.mapBundleToOrderDetails(bundle);
      expect(result.status).toBe(OrderStatus.PROCESSING);
    });
  });

  describe("extractStatus - direct status mapping", () => {
    it.each(["CONFIRMED", "DISPATCHED", "RECEIVED", "COMPLETE"])(
      "should map %s directly to OrderStatus",
      (statusCode) => {
        const bundle = createBundle(statusCode);
        const result = OrderDetailsMapper.mapBundleToOrderDetails(bundle);
        expect(result.status).toBe(statusCode);
      },
    );
  });

  describe("extractStatus - invalid status", () => {
    it("should throw for an unknown status code", () => {
      const bundle = createBundle("UNKNOWN");
      expect(() => OrderDetailsMapper.mapBundleToOrderDetails(bundle)).toThrow(
        "Invalid status: UNKNOWN",
      );
    });

    it("should throw when status code is missing", () => {
      const bundle = createBundle("CONFIRMED", {
        extension: [
          {
            url: BUSINESS_STATUS_EXTENSION_URL,
            extension: [{ url: "timestamp", valueDate: "2026-01-16" }],
            valueCodeableConcept: { coding: [] },
          },
        ],
      });

      expect(() => OrderDetailsMapper.mapBundleToOrderDetails(bundle)).toThrow("Missing status");
    });
  });

  describe("mapBundleToOrderDetails", () => {
    it("should map a complete bundle to OrderDetails", () => {
      const bundle = createBundle("DISPATCHED");
      const result = OrderDetailsMapper.mapBundleToOrderDetails(bundle);

      expect(result).toEqual({
        id: "test-order-id",
        orderedDate: "2026-01-15T10:30:00Z",
        referenceNumber: "12345",
        status: OrderStatus.DISPATCHED,
        supplier: "Test Supplier Ltd",
        dispatchedDate: "2026-01-16",
        maxDeliveryDays: 5,
      });
    });

    it("should throw when ServiceRequest is not in the bundle", () => {
      const bundle: Bundle = {
        resourceType: "Bundle",
        type: "searchset",
        total: 0,
        entry: [],
      };

      expect(() => OrderDetailsMapper.mapBundleToOrderDetails(bundle)).toThrow(
        "ServiceRequest not found in bundle",
      );
    });
  });
});
