import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

const mockInit = jest.fn();
let mockCreatePatientAndOrder = jest.fn();
const mockGetCorrelationIdFromEventHeaders = jest.fn();

jest.mock("./init", () => ({
  init: () => mockInit(),
}));

jest.mock("../lib/utils", () => ({
  ...jest.requireActual("../lib/utils"),
  getCorrelationIdFromEventHeaders: () =>
    mockGetCorrelationIdFromEventHeaders(),
}));

const buildEvent = (body: string | null): APIGatewayProxyEvent =>
  ({
    body,
    path: "/order",
    httpMethod: "POST",
    headers: {},
    multiValueHeaders: {},
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    pathParameters: null,
    stageVariables: null,
    requestContext: {} as APIGatewayProxyEvent["requestContext"],
    resource: "/order",
    isBase64Encoded: false,
  }) as APIGatewayProxyEvent;

const buildValidRequestBody = (): string =>
  JSON.stringify({
    testCode: "TEST001",
    testDescription: "Test description",
    supplierId: "123e4567-e89b-12d3-a456-426614174000",
    patient: {
      family: "Doe",
      given: ["Jane"],
      text: "Jane Doe",
      telecom: [{ phone: "0123456789" }, { email: "jane@example.com" }],
      address: {
        line: ["1 Test Street"],
        postalCode: "AB1 2CD",
      },
      birthDate: "1990-01-01",
      nhsNumber: "1234567890",
    },
  });

describe("order-service-lambda handler", () => {
  let handler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;

  beforeEach(async () => {
    jest.resetModules();
    mockInit.mockReset();
    mockCreatePatientAndOrder = jest.fn();
    mockGetCorrelationIdFromEventHeaders.mockReset();
    mockGetCorrelationIdFromEventHeaders.mockReturnValue(
      "123e4567-e89b-12d3-a456-426614174000",
    );
    mockInit.mockReturnValue({
      supplierService: {
        createPatientAndOrderAndStatus: mockCreatePatientAndOrder,
      },
    });

    const module = await import("./index");
    handler = module.handler;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Correlation ID handling", () => {
    it("should return 400 when getCorrelationIdFromEventHeaders throws an error", async () => {
      mockGetCorrelationIdFromEventHeaders.mockImplementation(() => {
        throw new Error("Correlation ID is missing or invalid");
      });

      const response = await handler(buildEvent(buildValidRequestBody()));

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).message).toBe(
        "Correlation ID is missing or invalid",
      );
    });

    it("should continue processing when correlation ID is successfully retrieved", async () => {
      mockGetCorrelationIdFromEventHeaders.mockReturnValue(
        "valid-correlation-id",
      );
      mockCreatePatientAndOrder.mockResolvedValue({
        orderUid: "order-123",
        orderReference: 456,
        patientUid: "patient-123",
      });

      const response = await handler(buildEvent(buildValidRequestBody()));

      expect(response.statusCode).toBe(201);
      expect(JSON.parse(response.body)).toEqual({
        orderUid: "order-123",
        orderReference: 456,
        message: "Order created successfully",
      });
    });
  });

  it("should return 400 when body is null", async () => {
    const response = await handler(buildEvent(null));

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toEqual({ message: "Empty body" });
  });

  it("should return 400 when body is empty object", async () => {
    const response = await handler(buildEvent("{}"));

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toEqual({ message: "Empty body" });
  });

  it("should return 400 for invalid JSON", async () => {
    const response = await handler(buildEvent("{ invalid json }"));

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toEqual({
      message: "Invalid JSON in request body",
    });
  });

  it("should return 400 for validation errors", async () => {
    const invalidBody = JSON.stringify({
      testCode: "TEST001",
      testDescription: "Test description",
      supplierId: "not-a-uuid",
      patient: {
        family: "Doe",
        telecom: [{ phone: "0123456789" }, { email: "jane@example.com" }],
        address: {
          line: ["1 Test Street"],
          postalCode: "AB1 2CD",
        },
        birthDate: "1990-01-01",
        nhsNumber: "1234567890",
      },
    });

    const response = await handler(buildEvent(invalidBody));

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).message).toMatch(/Validation failed/);
  });

  it("should create an order and return 201", async () => {
    mockCreatePatientAndOrder.mockResolvedValue({
      orderUid: "order-123",
      orderReference: 456,
      patientUid: "patient-123",
    });

    const response = await handler(buildEvent(buildValidRequestBody()));

    expect(response.statusCode).toBe(201);
    expect(JSON.parse(response.body)).toEqual({
      orderUid: "order-123",
      orderReference: 456,
      message: "Order created successfully",
    });
    expect(mockCreatePatientAndOrder).toHaveBeenCalledWith(
      "1234567890",
      "1990-01-01",
      "123e4567-e89b-12d3-a456-426614174000",
      "TEST001",
    );
  });

  it("should return 400 when createPatientAndOrderAndStatus throws", async () => {
    mockCreatePatientAndOrder.mockRejectedValue(new Error("DB down"));

    const response = await handler(buildEvent(buildValidRequestBody()));

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toEqual({ message: "DB down" });
  });
});
