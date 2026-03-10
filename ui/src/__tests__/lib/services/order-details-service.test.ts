import orderDetailsService from "@/lib/services/order-details-service";
import {OrderStatus} from "@/lib/models/order-details";

jest.mock("@/settings", () => ({backendUrl: "http://mock-backend"}));

const mockFetch = jest.fn();
globalThis.fetch = mockFetch as typeof fetch;

describe("OrderDetailsService", () => {
  const orderId = "550e8400-e29b-41d4-a716-446655440000";
  const nhsNumber = "2657119018";
  const dateOfBirth = "1990-08-11";
  const patient = {nhsNumber, dateOfBirth};

  const apiUrl = `http://mock-backend/get-order`;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return order details for a valid order id", async () => {
    const mockResponse = {
      "resourceType": "Bundle", "type": "searchset", "total": 1, "entry": [{
        "fullUrl": `urn:uuid:${orderId}`, "resource": {
          "resourceType": "ServiceRequest",
          "id": orderId,
          "identifier": [{"system": "https://fhir.hometest.nhs.uk/Id/order-id", "value": "100007"}],
          "status": "active",
          "intent": "order",
          "code": {
            "coding": [{
              "system": "http://snomed.info/sct",
              "code": "31676001",
              "display": "HIV antigen test"
            }], "text": "HIV antigen test"
          },
          "subject": {"reference": "#patient-1"},
          "requester": {"reference": "Organization/ORG001"},
          "performer": [{
            "reference": "Organization/77777777-7777-4777-8777-777777777777",
            "type": "Organization",
            "display": "SH:24"
          }],
          "authoredOn": "2026-03-09T13:56:17.471Z",
          "extension": [{
            "url": "https://fhir.hometest.nhs.uk/StructureDefinition/business-status",
            "extension": [{"url": "timestamp", "valueDate": "2026-03-09"}],
            "valueCodeableConcept": {
              "coding": [{
                "system": "https://fhir.hometest.nhs.uk/CodeSystem/order-business-status",
                "code": "DISPATCHED",
                "display": "Test has been dispatched to the patient"
              }], "text": "DISPATCHED"
            }
          }],
          "contained": [{
            "resourceType": "Patient",
            "id": "patient-1",
            "identifier": [{
              "system": "https://fhir.nhs.uk/Id/nhs-number",
              "value": nhsNumber,
              "use": "official"
            }],
            "birthDate": dateOfBirth
          }]
        }
      }]
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    })

    const response = await orderDetailsService.get(orderId, patient);

    expect(response).toEqual({
      dispatchedDate: "2026-03-09",
      id: "550e8400-e29b-41d4-a716-446655440000",
      maxDeliveryDays: 5,
      orderedDate: "2026-03-09T13:56:17.471Z",
      referenceNumber: "100007",
      status: "DISPATCHED",
      supplier: "SH:24"
    });

    expect(mockFetch).toHaveBeenCalledWith(`${apiUrl}?nhs_number=${nhsNumber}&date_of_birth=${dateOfBirth}&order_id=${orderId}`, {
      method: "GET",
      headers: {
        "Accept": "application/fhir+json",
      },
    })
  })
});
