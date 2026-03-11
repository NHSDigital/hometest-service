jest.mock("@/settings", () => ({ backendUrl: "http://mock-backend" }));

import orderService, {
  OrderServiceRequest,
  OrderServiceResponse,
} from "@/lib/services/order-service";

const mockFetch = jest.fn();
globalThis.fetch = mockFetch as typeof fetch;

describe("OrderService", () => {
  const request: OrderServiceRequest = {
    testCode: "31676001",
    testDescription: "COVID-19 test",
    supplierId: "SUP1",
    consent: true,
    patient: {
      family: "Doe",
      given: ["Jane"],
      telecom: [],
      address: {
        line: ["1 Test Street"],
        postalCode: "AB1 2CD",
      },
      birthDate: "1990-01-01",
      nhsNumber: "1234567890",
    },
  };

  const apiUrl = "http://mock-backend/order";
  let randomUUIDSpy: jest.SpyInstance<string, []>;

  beforeAll(() => {
    if (!globalThis.crypto) {
      Object.defineProperty(globalThis, "crypto", {
        value: { randomUUID: jest.fn() },
        configurable: true,
      });
    } else if (!globalThis.crypto.randomUUID) {
      Object.defineProperty(globalThis.crypto, "randomUUID", {
        value: jest.fn(),
        configurable: true,
      });
    }
  });

  beforeEach(() => {
    randomUUIDSpy = jest
      .spyOn(globalThis.crypto, "randomUUID")
      .mockReturnValue("test-uuid");
  });

  afterEach(() => {
    randomUUIDSpy.mockRestore();
    jest.clearAllMocks();
  });

  it("should submit an order and return the response", async () => {
    const mockResponse: OrderServiceResponse = {
      orderUid: "order-uid",
      orderReference: 12345,
      message: "Order created",
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await orderService.submitOrder(request);

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Correlation-ID": "test-uuid",
      },
      body: JSON.stringify(request),
    });
    expect(randomUUIDSpy).toHaveBeenCalledTimes(1);
  });

  it("should throw an error when the API returns a message", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ message: "Bad request" }),
    });

    await expect(orderService.submitOrder(request)).rejects.toThrow(
      "Bad request",
    );
  });

  it("should throw a fallback error when the response has no message", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error("No JSON");
      },
    });

    await expect(orderService.submitOrder(request)).rejects.toThrow(
      "Failed to submit order: 500",
    );
  });
});
