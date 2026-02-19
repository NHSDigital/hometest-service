import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { OrderServiceRequestSchema } from "./order-service-request-schema";

const mockInit = jest.fn();
const mockCreatePatientAndOrder = jest.fn();
const mockUpdateOrderStatus = jest.fn();
const mockSendMessage = jest.fn();
const mockGetCorrelationIdFromEventHeaders = jest.fn();
const mockBuildFhirServiceRequest = jest.fn();
const mockOrderPlacementQueueUrl =
  "https://sqs.eu-west-2.amazonaws.com/123456789012/order-placement";

jest.mock("./init", () => ({
  init: () => mockInit(),
}));

jest.mock("../lib/utils", () => ({
  ...jest.requireActual("../lib/utils"),
  getCorrelationIdFromEventHeaders: () =>
    mockGetCorrelationIdFromEventHeaders(),
}));

jest.mock("./fhir-mapper", () => ({
  buildFhirServiceRequest: (...args: unknown[]) =>
    mockBuildFhirServiceRequest(...args),
}));

const validSupplierId = "123e4567-e89b-12d3-a456-426614174000";

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

const basePatient = {
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
};

const buildRequestBody = (overrides: Partial<any> = {}): string =>
  JSON.stringify({
    testCode: "TEST001",
    testDescription: "Test description",
    supplierId: validSupplierId,
    patient: { ...basePatient, ...(overrides.patient || {}) },
    consent: overrides.consent !== undefined ? overrides.consent : true,
    ...overrides,
  });

const buildValidRequestBody = (): string => buildRequestBody();

describe("order-service-lambda handler", () => {
  let handler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;

  beforeEach(async () => {
    jest.resetModules();
    mockInit.mockReset();
    mockCreatePatientAndOrder.mockReset();
    mockUpdateOrderStatus.mockReset();
    mockSendMessage.mockReset();
    mockGetCorrelationIdFromEventHeaders.mockReset();
    mockBuildFhirServiceRequest.mockReset();
    mockGetCorrelationIdFromEventHeaders.mockReturnValue(
      "123e4567-e89b-12d3-a456-426614174123",
    );
    mockInit.mockReturnValue({
      supplierService: {
        createPatientAndOrderAndStatus: mockCreatePatientAndOrder,
        updateOrderStatus: mockUpdateOrderStatus,
      },
      sqsClient: {
        sendMessage: mockSendMessage,
      },
      orderPlacementQueueUrl: mockOrderPlacementQueueUrl,
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
      mockBuildFhirServiceRequest.mockReturnValue({
        resourceType: "ServiceRequest",
      });
      mockSendMessage.mockResolvedValue({ messageId: "message-123" });
      mockUpdateOrderStatus.mockResolvedValue(undefined);

      const response = await handler(buildEvent(buildValidRequestBody()));

      expect(response.statusCode).toBe(201);
      expect(JSON.parse(response.body)).toEqual({
        orderUid: "order-123",
        orderReference: 456,
        message: "Order created successfully",
      });
    });
  });

  describe("Request validation", () => {
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
      const invalidBody = buildRequestBody({
        supplierId: "not-a-uuid",
        patient: { ...basePatient, given: undefined, text: undefined },
      });
      const response = await handler(buildEvent(invalidBody));
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).message).toMatch(/Validation failed/);
    });

    it("should return 400 when consent field is missing", async () => {
      const bodyWithoutConsent = buildRequestBody({ consent: undefined });
      const response = await handler(buildEvent(bodyWithoutConsent));
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).message).toMatch(/Validation failed/);
    });

    it("should return 400 when consent is false", async () => {
      const body = buildRequestBody({ consent: false });
      const response = await handler(buildEvent(body));
      expect(response.statusCode).toBe(400);
      const responseBody = JSON.parse(response.body);
      expect(responseBody.message).toMatch(/Validation failed/);
      expect(responseBody.message).toMatch(/consent must be true/);
    });
  });

  describe("Successful order processing", () => {
    const mockFhirServiceRequest = {
      resourceType: "ServiceRequest",
      id: "order-123",
    };

    beforeEach(() => {
      mockCreatePatientAndOrder.mockResolvedValue({
        orderUid: "order-123",
        orderReference: 456,
        patientUid: "patient-123",
      });
      mockBuildFhirServiceRequest.mockReturnValue(mockFhirServiceRequest);
      mockSendMessage.mockResolvedValue({ messageId: "message-123" });
      mockUpdateOrderStatus.mockResolvedValue(undefined);
    });

    it("should create an order and return 201", async () => {
      const response = await handler(buildEvent(buildValidRequestBody()));

      expect(response.statusCode).toBe(201);
      expect(JSON.parse(response.body)).toEqual({
        orderUid: "order-123",
        orderReference: 456,
        message: "Order created successfully",
      });
    });

    it("should call createPatientAndOrderAndStatus with correct params", async () => {
      await handler(buildEvent(buildValidRequestBody()));

      expect(mockCreatePatientAndOrder).toHaveBeenCalledWith(
        "1234567890",
        "1990-01-01",
        validSupplierId,
        "TEST001",
      );
    });

    it("should call buildFhirServiceRequest with correct params", async () => {
      const requestBody = buildValidRequestBody();
      const orderRequest = OrderServiceRequestSchema.safeParse(
        JSON.parse(requestBody),
      ).data;
      await handler(buildEvent(requestBody));

      expect(mockBuildFhirServiceRequest).toHaveBeenCalledWith(
        orderRequest,
        "patient-123",
        "order-123",
      );
    });

    it("should send message to SQS with correct params", async () => {
      mockGetCorrelationIdFromEventHeaders.mockReturnValue(
        "valid-correlation-id",
      );
      const parsedOrderBody = {
        supplier_code: validSupplierId,
        correlation_id: "valid-correlation-id",
        order_body: mockFhirServiceRequest,
      };

      await handler(buildEvent(buildValidRequestBody()));

      expect(mockSendMessage).toHaveBeenCalledWith(
        mockOrderPlacementQueueUrl,
        JSON.stringify(parsedOrderBody),
      );
    });

    it("should update order status to QUEUED", async () => {
      await handler(buildEvent(buildValidRequestBody()));

      expect(mockUpdateOrderStatus).toHaveBeenCalledWith(
        "order-123",
        456,
        "QUEUED",
      );
    });
  });

  describe("Error handling", () => {
    it("should return 400 when createPatientAndOrderAndStatus throws", async () => {
      mockCreatePatientAndOrder.mockRejectedValue(new Error("DB down"));

      const response = await handler(buildEvent(buildValidRequestBody()));

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body)).toEqual({ message: "DB down" });
    });

    it("should return 500 when sending to SQS fails", async () => {
      mockCreatePatientAndOrder.mockResolvedValue({
        orderUid: "order-123",
        orderReference: 456,
        patientUid: "patient-123",
      });
      mockBuildFhirServiceRequest.mockReturnValue({
        resourceType: "ServiceRequest",
      });
      mockSendMessage.mockRejectedValue(new Error("SQS down"));

      const response = await handler(buildEvent(buildValidRequestBody()));

      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body)).toEqual({
        message: "Failed to enqueue order",
      });
      expect(mockUpdateOrderStatus).not.toHaveBeenCalled();
    });

    it("should return 500 when updating order status fails", async () => {
      mockCreatePatientAndOrder.mockResolvedValue({
        orderUid: "order-123",
        orderReference: 456,
        patientUid: "patient-123",
      });
      mockBuildFhirServiceRequest.mockReturnValue({
        resourceType: "ServiceRequest",
      });
      mockSendMessage.mockResolvedValue({ messageId: "message-123" });
      mockUpdateOrderStatus.mockRejectedValue(new Error("DB down"));

      const response = await handler(buildEvent(buildValidRequestBody()));

      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body)).toEqual({
        message: "Failed to update order status",
      });
    });
  });
});
