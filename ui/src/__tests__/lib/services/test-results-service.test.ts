jest.mock("@/settings", () => ({ backendUrl: "http://mock-backend" }));

import testResultsService from "@/lib/services/test-results-service";

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("TestResultsService", () => {
  const orderId = "550e8400-e29b-41d4-a716-446655440000";
  const patient = {
    nhsNumber: "2657119018",
    dateOfBirth: "1990-08-11",
  };
  const correlationId = "11111111-1111-4111-8111-111111111111";

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(crypto, "randomUUID").mockReturnValue(correlationId);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("calls /results with order status query params and x-correlation-id", async () => {
    const mockObservation = { resourceType: "Observation", id: "obs-1" };
    mockFetch.mockResolvedValueOnce({
      status: 200,
      json: async () => mockObservation,
    });

    const result = await testResultsService.get(orderId, patient);

    expect(result).toEqual({ id: "obs-1" });
    expect(mockFetch).toHaveBeenCalledWith(
      `http://mock-backend/results?nhs_number=${patient.nhsNumber}&date_of_birth=${patient.dateOfBirth}&order_id=${orderId}`,
      {
        method: "GET",
        headers: {
          Accept: "application/fhir+json",
          "x-correlation-id": correlationId,
        },
      },
    );
  });

  it("returns null when API responds with 404", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 404,
      json: async () => ({ issue: [{ code: "not-found" }] }),
    });

    const result = await testResultsService.get(orderId, patient);

    expect(result).toBeNull();
  });
});
