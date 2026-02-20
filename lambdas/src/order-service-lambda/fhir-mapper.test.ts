import { mapTelecomToFhirContactPoints, buildFhirServiceRequest } from "./fhir-mapper";
import type { OrderServiceRequest } from "./order-service-request-type";

describe("fhir-mapper", () => {
  describe("mapTelecomToFhirContactPoints", () => {
    it("should map phone and email to FHIR contact points", () => {
      const telecom = [
        { phone: "01234567890" },
        { email: "test@example.com" },
      ];

      const result = mapTelecomToFhirContactPoints(telecom);

      expect(result).toEqual([
        { system: "phone", value: "01234567890" },
        { system: "email", value: "test@example.com" },
      ]);
    });

    it("should handle multiple contact types in one entry", () => {
      const telecom = [
        { phone: "01234567890", fax: "09876543210" },
        { email: "test@example.com" },
      ];

      const result = mapTelecomToFhirContactPoints(telecom);

      expect(result).toEqual([
        { system: "phone", value: "01234567890" },
        { system: "fax", value: "09876543210" },
        { system: "email", value: "test@example.com" },
      ]);
    });

    it("should handle all supported contact types", () => {
      const telecom = [
        {
          phone: "01234567890",
          fax: "09876543210",
          email: "test@example.com",
          pager: "12345",
          url: "https://example.com",
          sms: "07700900000",
          other: "other-contact",
        },
      ];

      const result = mapTelecomToFhirContactPoints(telecom);

      expect(result).toEqual([
        { system: "phone", value: "01234567890" },
        { system: "fax", value: "09876543210" },
        { system: "email", value: "test@example.com" },
        { system: "pager", value: "12345" },
        { system: "url", value: "https://example.com" },
        { system: "sms", value: "07700900000" },
        { system: "other", value: "other-contact" },
      ]);
    });

    it("should return empty array for empty telecom", () => {
      const result = mapTelecomToFhirContactPoints([]);
      expect(result).toEqual([]);
    });
  });

  describe("buildFhirServiceRequest", () => {
    const mockOrderRequest: OrderServiceRequest = {
      testCode: "TEST001",
      testDescription: "HIV Test",
      supplierId: "550e8400-e29b-41d4-a716-446655440000",
      patient: {
        family: "Doe",
        given: ["Jane"],
        text: "Jane Doe",
        telecom: [{ phone: "01234567890" }, { email: "jane@example.com" }],
        address: {
          use: "home",
          type: "both",
          line: ["123 Main Street"],
          city: "London",
          postalCode: "SW1A 1AA",
          country: "UK",
        },
        birthDate: "1990-01-01",
        nhsNumber: "1234567890",
      },
      consent: true,
    };

    it("should build a valid FHIR ServiceRequest", () => {
      const patientUid = "patient-123";
      const orderUid = "order-456";

      const result = buildFhirServiceRequest(
        mockOrderRequest,
        patientUid,
        orderUid,
      );

      expect(result).toEqual({
        resourceType: "ServiceRequest",
        id: orderUid,
        status: "active",
        intent: "order",
        code: {
          coding: [
            {
              system: "http://snomed.info/sct",
              code: "TEST001",
              display: "HIV Test",
            },
          ],
          text: "HIV Test",
        },
        contained: [
          {
            resourceType: "Patient",
            id: patientUid,
            name: [
              {
                use: "official",
                family: "Doe",
                given: ["Jane"],
                text: "Jane Doe",
              },
            ],
            telecom: [
              { system: "phone", value: "01234567890" },
              { system: "email", value: "jane@example.com" },
            ],
            address: [
              {
                use: "home",
                type: "both",
                line: ["123 Main Street"],
                city: "London",
                postalCode: "SW1A 1AA",
                country: "UK",
              },
            ],
            birthDate: "1990-01-01",
          },
        ],
        subject: {
          reference: `#${patientUid}`,
        },
        requester: {
          reference: "HIV webapp",
        },
        performer: [
          {
            reference: "550e8400-e29b-41d4-a716-446655440000",
          },
        ],
      });
    });

    it("should handle minimal address information", () => {
      const minimalRequest: OrderServiceRequest = {
        ...mockOrderRequest,
        patient: {
          ...mockOrderRequest.patient,
          address: {
            line: ["1 Test St"],
            postalCode: "AB1 2CD",
          },
        },
      };

      const result = buildFhirServiceRequest(
        minimalRequest,
        "patient-123",
        "order-456",
      );

      expect(result.contained[0].address[0]).toEqual({
        use: undefined,
        type: undefined,
        line: ["1 Test St"],
        city: undefined,
        postalCode: "AB1 2CD",
        country: undefined,
      });
    });

    it("should correctly map patient reference", () => {
      const patientUid = "unique-patient-id";
      const result = buildFhirServiceRequest(
        mockOrderRequest,
        patientUid,
        "order-456",
      );

      expect(result.subject.reference).toBe(`#${patientUid}`);
      expect(result.contained[0].id).toBe(patientUid);
    });

    it("should correctly map supplier as performer", () => {
      const supplierId = "custom-supplier-uuid";
      const requestWithCustomSupplier: OrderServiceRequest = {
        ...mockOrderRequest,
        supplierId,
      };

      const result = buildFhirServiceRequest(
        requestWithCustomSupplier,
        "patient-123",
        "order-456",
      );

      expect(result.performer?.[0].reference).toBe(supplierId);
    });
  });
});
