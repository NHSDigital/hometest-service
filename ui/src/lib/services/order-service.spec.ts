jest.mock("@/settings", () => ({ backendUrl: "http://mock-backend" }));
import orderService, { OrderServiceRequest, OrderServiceResponse } from "./order-service";

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

describe("OrderService", () => {
  const apiUrl = "http://mock-backend/order";
  const correlationId = "test-correlation-id";
  let originalCrypto: Crypto | undefined;

  const request: OrderServiceRequest = {
    testCode: "31676001",
    testDescription: "COVID-19 PCR",
    supplierId: "SUP1",
    patient: {
      family: "Doe",
      given: ["Jane"],
      text: "Jane Doe",
      telecom: [{ phone: "07123456789" }],
      address: {
        line: ["1 High Street"],
        city: "Salford",
        postalCode: "M50 3UQ",
        country: "GB",
        use: "home",
        type: "both",
      },
      birthDate: "1990-01-01",
      nhsNumber: "1234567890",
    },
    consent: true,
  };

  beforeAll(() => {
    originalCrypto = global.crypto;
    Object.defineProperty(global, "crypto", {
      value: { randomUUID: jest.fn(() => correlationId) },
      configurable: true,
    });
  });

  afterAll(() => {
    if (originalCrypto) {
      Object.defineProperty(global, "crypto", {
        value: originalCrypto,
        configurable: true,
      });
      return;
    }
    // Ensure crypto is removed if it did not exist before tests.

    delete (global as { crypto?: Crypto }).crypto;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should submit an order and return the response", async () => {
    const mockResponse: OrderServiceResponse = {
      orderUid: "order-uid-1",
      orderReference: "order-ref-1",
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
        "X-Correlation-ID": correlationId,
      },
      body: JSON.stringify(request),
    });
  });

  it("should throw an error with server message when response is not ok", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ message: "Invalid order" }),
    });

    await expect(orderService.submitOrder(request)).rejects.toThrow("Invalid order");
    expect(mockFetch).toHaveBeenCalledWith(apiUrl, expect.objectContaining({ method: "POST" }));
  });

  it("should throw a fallback error when response json fails", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error("bad json");
      },
    });

    await expect(orderService.submitOrder(request)).rejects.toThrow("Failed to submit order: 500");
    expect(mockFetch).toHaveBeenCalledWith(apiUrl, expect.objectContaining({ method: "POST" }));
  });
});
