import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Context, SQSEvent, SQSRecord } from "aws-lambda";
import { HttpError } from "../lib/http/http-client";

// Setup mocks
const mockHttpClientPostRaw = jest.fn();
const mockSupplierAuthGetAccessToken = jest.fn();
const mockGetSupplierConfigBySupplierId = jest.fn();

const supplierOrderBody = JSON.parse(
  readFileSync(
    join(__dirname, "../__mocks__/supplier_order_placement_body_valid.json"),
    "utf-8",
  ),
) as Record<string, unknown>;

jest.mock("./init", () => ({
  init: jest.fn(() => ({
    httpClient: {
      postRaw: mockHttpClientPostRaw,
    },
    supplierDb: {
      getSupplierConfigBySupplierId: mockGetSupplierConfigBySupplierId,
    },
    secretsClient: {},
  })),
}));

// Mock OAuthSupplierAuthClient
jest.mock("../lib/supplier/supplier-auth-client", () => {
  return {
    OAuthSupplierAuthClient: jest.fn().mockImplementation(() => ({
      getAccessToken: mockSupplierAuthGetAccessToken,
    })),
  };
});

// Import handler after mocking
import { handler } from "./index";

describe("order-router-lambda", () => {
  let mockContext: Partial<Context>;
  const validUUID = "123e4567-e89b-12d3-a456-426614174000";
  const validCorrelationId = "550e8400-e29b-41d4-a716-446655440000";
  const mockServiceUrl = "http://supplier-service-url.com";

  const createSQSEvent = (records: Partial<SQSRecord>[]): SQSEvent => ({
    Records: records.map((record) => ({
      messageId: record.messageId || "test-message-id",
      receiptHandle: record.receiptHandle || "test-receipt-handle",
      body: record.body || "{}",
      attributes: {
        ApproximateReceiveCount: "1",
        SentTimestamp: "1234567890",
        SenderId: "test-sender",
        ApproximateFirstReceiveTimestamp: "1234567890",
      },
      messageAttributes: {},
      md5OfBody: "test-md5",
      eventSource: "aws:sqs",
      eventSourceARN: "arn:aws:sqs:eu-west-2:123456789012:test-queue",
      awsRegion: "eu-west-2",
    })) as SQSRecord[],
  });

  beforeEach(() => {
    mockContext = {
      functionName: "order-router",
      functionVersion: "1",
      invokedFunctionArn:
        "arn:aws:lambda:eu-west-2:123456789012:function:order-router",
      memoryLimitInMB: "128",
      awsRequestId: "test-request-id",
      logGroupName: "/aws/lambda/order-router",
      logStreamName: "2026/02/02/[$LATEST]test",
      getRemainingTimeInMillis: () => 30000,
      done: jest.fn(),
      fail: jest.fn(),
      succeed: jest.fn(),
    };

    // Reset mocks
    mockHttpClientPostRaw.mockReset();
    mockSupplierAuthGetAccessToken.mockReset();
    mockGetSupplierConfigBySupplierId.mockReset();

    process.env.AWS_REGION = "eu-west-2";
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockDefaultSupplierConfig = () =>
    mockGetSupplierConfigBySupplierId.mockResolvedValue({
      serviceUrl: mockServiceUrl,
      clientSecretName: "secret-name",
      clientId: "client-id",
      oauthTokenPath: "/oauth/token",
      orderPath: "/order",
      oauthScope: "orders results",
    });

  describe("successful order processing", () => {
    beforeEach(() => {
      mockDefaultSupplierConfig();
      mockSupplierAuthGetAccessToken.mockResolvedValue("test-access-token");
    });

    it("should process a single valid SQS message successfully", async () => {
      mockHttpClientPostRaw.mockResolvedValue({
        status: 201,
        text: async () => JSON.stringify({ id: "order-123" }),
        headers: { get: () => "application/fhir+json" },
      });

      const messageBody = JSON.stringify({
        supplier_code: validUUID,
        correlation_id: validCorrelationId,
        order_body: supplierOrderBody,
      });

      const sqsEvent = createSQSEvent([
        { messageId: "msg-1", body: messageBody },
      ]);

      const result = await handler(sqsEvent, mockContext as Context);

      expect(result.batchItemFailures).toEqual([]);
      expect(mockGetSupplierConfigBySupplierId).toHaveBeenCalledWith(validUUID);
      expect(mockSupplierAuthGetAccessToken).toHaveBeenCalled();
      expect(mockHttpClientPostRaw).toHaveBeenCalledWith(
        `${mockServiceUrl}/order`,
        JSON.stringify(supplierOrderBody),
        expect.objectContaining({
          Authorization: "Bearer test-access-token",
          Accept: "application/fhir+json",
          "X-Correlation-ID": validCorrelationId,
        }),
        "application/fhir+json",
      );
    });

    it("should process multiple valid SQS messages successfully", async () => {
      mockHttpClientPostRaw.mockResolvedValue({
        status: 201,
        text: async () => JSON.stringify({ id: "order-123" }),
        headers: { get: () => "application/fhir+json" },
      });

      const messageBody1 = JSON.stringify({
        supplier_code: validUUID,
        correlation_id: validCorrelationId,
        order_body: supplierOrderBody,
      });

      const messageBody2 = JSON.stringify({
        supplier_code: validUUID,
        correlation_id: "550e8400-e29b-41d4-a716-446655440001",
        order_body: supplierOrderBody,
      });

      const sqsEvent = createSQSEvent([
        { messageId: "msg-1", body: messageBody1 },
        { messageId: "msg-2", body: messageBody2 },
      ]);

      const result = await handler(sqsEvent, mockContext as Context);

      expect(result.batchItemFailures).toEqual([]);
      expect(mockHttpClientPostRaw).toHaveBeenCalledTimes(2);
    });

    it("should accept 200 status as successful order processing", async () => {
      mockHttpClientPostRaw.mockResolvedValue({
        status: 200,
        text: async () => JSON.stringify({ id: "order-123" }),
        headers: { get: () => "application/fhir+json" },
      });

      const messageBody = JSON.stringify({
        supplier_code: validUUID,
        correlation_id: validCorrelationId,
        order_body: supplierOrderBody,
      });

      const sqsEvent = createSQSEvent([
        { messageId: "msg-1", body: messageBody },
      ]);

      const result = await handler(sqsEvent, mockContext as Context);

      expect(result.batchItemFailures).toEqual([]);
    });
  });

  describe("message validation errors", () => {
    it("should fail for invalid JSON in message body", async () => {
      const sqsEvent = createSQSEvent([
        { messageId: "msg-1", body: "{ invalid json }" },
      ]);

      const result = await handler(sqsEvent, mockContext as Context);

      expect(result.batchItemFailures).toEqual([{ itemIdentifier: "msg-1" }]);
    });

    it("should fail for missing supplier_code", async () => {
      const messageBody = JSON.stringify({
        correlation_id: validCorrelationId,
        order_body: supplierOrderBody,
      });

      const sqsEvent = createSQSEvent([
        { messageId: "msg-1", body: messageBody },
      ]);

      const result = await handler(sqsEvent, mockContext as Context);

      expect(result.batchItemFailures).toEqual([{ itemIdentifier: "msg-1" }]);
    });

    it("should fail for non-UUID supplier_code", async () => {
      const messageBody = JSON.stringify({
        supplier_code: "not-a-uuid",
        correlation_id: validCorrelationId,
        order_body: supplierOrderBody,
      });

      const sqsEvent = createSQSEvent([
        { messageId: "msg-1", body: messageBody },
      ]);

      const result = await handler(sqsEvent, mockContext as Context);

      expect(result.batchItemFailures).toEqual([{ itemIdentifier: "msg-1" }]);
    });

    it("should fail for missing correlation_id", async () => {
      const messageBody = JSON.stringify({
        supplier_code: validUUID,
        order_body: supplierOrderBody,
      });

      const sqsEvent = createSQSEvent([
        { messageId: "msg-1", body: messageBody },
      ]);

      const result = await handler(sqsEvent, mockContext as Context);

      expect(result.batchItemFailures).toEqual([{ itemIdentifier: "msg-1" }]);
    });

    it("should fail for non-UUID correlation_id", async () => {
      const messageBody = JSON.stringify({
        supplier_code: validUUID,
        correlation_id: "not-a-uuid",
        order_body: supplierOrderBody,
      });

      const sqsEvent = createSQSEvent([
        { messageId: "msg-1", body: messageBody },
      ]);

      const result = await handler(sqsEvent, mockContext as Context);

      expect(result.batchItemFailures).toEqual([{ itemIdentifier: "msg-1" }]);
    });

    it("should fail for missing order_body", async () => {
      const messageBody = JSON.stringify({
        supplier_code: validUUID,
        correlation_id: validCorrelationId,
      });

      const sqsEvent = createSQSEvent([
        { messageId: "msg-1", body: messageBody },
      ]);

      const result = await handler(sqsEvent, mockContext as Context);

      expect(result.batchItemFailures).toEqual([{ itemIdentifier: "msg-1" }]);
    });

    it("should fail for null order_body", async () => {
      const messageBody = JSON.stringify({
        supplier_code: validUUID,
        correlation_id: validCorrelationId,
        order_body: null,
      });

      const sqsEvent = createSQSEvent([
        { messageId: "msg-1", body: messageBody },
      ]);

      const result = await handler(sqsEvent, mockContext as Context);

      expect(result.batchItemFailures).toEqual([{ itemIdentifier: "msg-1" }]);
    });

    it("should fail for non-object order_body", async () => {
      const messageBody = JSON.stringify({
        supplier_code: validUUID,
        correlation_id: validCorrelationId,
        order_body: "not-an-object",
      });

      const sqsEvent = createSQSEvent([
        { messageId: "msg-1", body: messageBody },
      ]);

      const result = await handler(sqsEvent, mockContext as Context);

      expect(result.batchItemFailures).toEqual([{ itemIdentifier: "msg-1" }]);
    });
  });

  describe("supplier configuration errors", () => {
    it("should fail if supplier not found in database", async () => {
      mockGetSupplierConfigBySupplierId.mockResolvedValue(null);

      const messageBody = JSON.stringify({
        supplier_code: validUUID,
        correlation_id: validCorrelationId,
        order_body: supplierOrderBody,
      });

      const sqsEvent = createSQSEvent([
        { messageId: "msg-1", body: messageBody },
      ]);

      const result = await handler(sqsEvent, mockContext as Context);

      expect(result.batchItemFailures).toEqual([{ itemIdentifier: "msg-1" }]);
      expect(mockGetSupplierConfigBySupplierId).toHaveBeenCalledWith(validUUID);
    });

    it("should fail when supplier config retrieval throws error", async () => {
      mockGetSupplierConfigBySupplierId.mockRejectedValue(
        new Error("Database connection failed"),
      );

      const messageBody = JSON.stringify({
        supplier_code: validUUID,
        correlation_id: validCorrelationId,
        order_body: supplierOrderBody,
      });

      const sqsEvent = createSQSEvent([
        { messageId: "msg-1", body: messageBody },
      ]);

      const result = await handler(sqsEvent, mockContext as Context);

      expect(result.batchItemFailures).toEqual([{ itemIdentifier: "msg-1" }]);
    });
  });

  describe("authentication errors", () => {
    beforeEach(() => {
      mockDefaultSupplierConfig();
    });

    it("should fail when OAuth token request fails", async () => {
      const mockErrorResponse = JSON.stringify({ error: "invalid_client" });

      mockSupplierAuthGetAccessToken.mockRejectedValue(
        new HttpError(
          "HTTP POST request failed with status: 401",
          401,
          mockErrorResponse,
        ),
      );

      const messageBody = JSON.stringify({
        supplier_code: validUUID,
        correlation_id: validCorrelationId,
        order_body: supplierOrderBody,
      });

      const sqsEvent = createSQSEvent([
        { messageId: "msg-1", body: messageBody },
      ]);

      const result = await handler(sqsEvent, mockContext as Context);

      expect(result.batchItemFailures).toEqual([{ itemIdentifier: "msg-1" }]);
      expect(mockSupplierAuthGetAccessToken).toHaveBeenCalled();
    });
  });

  describe("supplier order submission errors", () => {
    beforeEach(() => {
      mockDefaultSupplierConfig();
      mockSupplierAuthGetAccessToken.mockResolvedValue("test-access-token");
    });

    it("should fail when supplier returns 400 Bad Request", async () => {
      const mockErrorResponse = JSON.stringify({
        resourceType: "OperationOutcome",
        issue: [{ severity: "error", code: "invalid" }],
      });

      mockHttpClientPostRaw.mockRejectedValue(
        new HttpError(
          "HTTP POST request failed with status: 400",
          400,
          mockErrorResponse,
        ),
      );

      const messageBody = JSON.stringify({
        supplier_code: validUUID,
        correlation_id: validCorrelationId,
        order_body: supplierOrderBody,
      });

      const sqsEvent = createSQSEvent([
        { messageId: "msg-1", body: messageBody },
      ]);

      const result = await handler(sqsEvent, mockContext as Context);

      expect(result.batchItemFailures).toEqual([{ itemIdentifier: "msg-1" }]);
    });

    it("should fail when supplier returns 409 Conflict (business rule)", async () => {
      mockHttpClientPostRaw.mockResolvedValue({
        status: 409,
        text: async () =>
          JSON.stringify({
            resourceType: "OperationOutcome",
            issue: [
              {
                severity: "error",
                code: "business-rule",
                details: { text: "Out of stock" },
              },
            ],
          }),
        headers: { get: () => "application/fhir+json" },
      });

      const messageBody = JSON.stringify({
        supplier_code: validUUID,
        correlation_id: validCorrelationId,
        order_body: supplierOrderBody,
      });

      const sqsEvent = createSQSEvent([
        { messageId: "msg-1", body: messageBody },
      ]);

      const result = await handler(sqsEvent, mockContext as Context);

      expect(result.batchItemFailures).toEqual([{ itemIdentifier: "msg-1" }]);
    });

    it("should fail when supplier returns 422 Unprocessable Entity", async () => {
      mockHttpClientPostRaw.mockResolvedValue({
        status: 422,
        text: async () =>
          JSON.stringify({
            resourceType: "OperationOutcome",
            issue: [
              {
                severity: "error",
                code: "structure",
                details: { text: "FHIR validation error" },
              },
            ],
          }),
        headers: { get: () => "application/fhir+json" },
      });

      const messageBody = JSON.stringify({
        supplier_code: validUUID,
        correlation_id: validCorrelationId,
        order_body: supplierOrderBody,
      });

      const sqsEvent = createSQSEvent([
        { messageId: "msg-1", body: messageBody },
      ]);

      const result = await handler(sqsEvent, mockContext as Context);

      expect(result.batchItemFailures).toEqual([{ itemIdentifier: "msg-1" }]);
    });

    it("should fail when supplier returns 500 Internal Server Error", async () => {
      mockHttpClientPostRaw.mockRejectedValue(
        new HttpError("HTTP POST request failed with status: 500", 500, ""),
      );

      const messageBody = JSON.stringify({
        supplier_code: validUUID,
        correlation_id: validCorrelationId,
        order_body: supplierOrderBody,
      });

      const sqsEvent = createSQSEvent([
        { messageId: "msg-1", body: messageBody },
      ]);

      const result = await handler(sqsEvent, mockContext as Context);

      expect(result.batchItemFailures).toEqual([{ itemIdentifier: "msg-1" }]);
    });
  });

  describe("partial batch failures", () => {
    beforeEach(() => {
      mockDefaultSupplierConfig();
      mockSupplierAuthGetAccessToken.mockResolvedValue("test-access-token");
    });

    it("should process successful messages and fail only invalid ones", async () => {
      mockHttpClientPostRaw.mockResolvedValue({
        status: 201,
        text: async () => JSON.stringify({ id: "order-123" }),
        headers: { get: () => "application/fhir+json" },
      });

      const validMessage = JSON.stringify({
        supplier_code: validUUID,
        correlation_id: validCorrelationId,
        order_body: supplierOrderBody,
      });

      const invalidMessage = "{ invalid json }";

      const sqsEvent = createSQSEvent([
        { messageId: "msg-1", body: validMessage },
        { messageId: "msg-2", body: invalidMessage },
        { messageId: "msg-3", body: validMessage },
      ]);

      const result = await handler(sqsEvent, mockContext as Context);

      expect(result.batchItemFailures).toEqual([{ itemIdentifier: "msg-2" }]);
      expect(mockHttpClientPostRaw).toHaveBeenCalledTimes(2);
    });

    it("should handle mixed success and supplier errors", async () => {
      mockHttpClientPostRaw
        .mockResolvedValueOnce({
          status: 201,
          text: async () => JSON.stringify({ id: "order-1" }),
          headers: { get: () => "application/fhir+json" },
        })
        .mockResolvedValueOnce({
          status: 409,
          text: async () =>
            JSON.stringify({
              resourceType: "OperationOutcome",
              issue: [{ severity: "error", code: "business-rule" }],
            }),
          headers: { get: () => "application/fhir+json" },
        })
        .mockResolvedValueOnce({
          status: 201,
          text: async () => JSON.stringify({ id: "order-3" }),
          headers: { get: () => "application/fhir+json" },
        });

      const messageBody = JSON.stringify({
        supplier_code: validUUID,
        correlation_id: validCorrelationId,
        order_body: supplierOrderBody,
      });

      const sqsEvent = createSQSEvent([
        { messageId: "msg-1", body: messageBody },
        { messageId: "msg-2", body: messageBody },
        { messageId: "msg-3", body: messageBody },
      ]);

      const result = await handler(sqsEvent, mockContext as Context);

      expect(result.batchItemFailures).toEqual([{ itemIdentifier: "msg-2" }]);
      expect(mockHttpClientPostRaw).toHaveBeenCalledTimes(3);
    });
  });
});
