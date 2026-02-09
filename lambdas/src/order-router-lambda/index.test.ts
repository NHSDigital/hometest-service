import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { EnvironmentVariables } from "./init";

// Setup mocks
const mockHttpClientPostRaw = jest.fn();
const mockSupplierAuthGetAccessToken = jest.fn();
const mockGetSupplierServiceUrlBySupplierId = jest.fn();
const mockEnvironmentVariables: EnvironmentVariables =
  {} as EnvironmentVariables;

jest.mock("./init", () => ({
  init: jest.fn(() => ({
    httpClient: {
      postRaw: mockHttpClientPostRaw,
    },
    supplierAuthClient: {
      getAccessToken: mockSupplierAuthGetAccessToken,
    },
    environmentVariables: mockEnvironmentVariables,
    supplierDb: {
      getSupplierServiceUrlBySupplierId: mockGetSupplierServiceUrlBySupplierId,
    },
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
  let mockEvent: Partial<APIGatewayProxyEvent>;
  let mockContext: Partial<Context>;
  const validUUID = "123e4567-e89b-12d3-a456-426614174000";
  const mockServiceUrl = "http://supplier-service-url.com";

  beforeEach(() => {
    mockEvent = {
      httpMethod: "POST",
      path: "/test-order/order",
      body: null,
      headers: {},
      queryStringParameters: null,
    };

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
    mockGetSupplierServiceUrlBySupplierId.mockReset();

    // Set environment variables
    mockEnvironmentVariables.SUPPLIER_OAUTH_TOKEN_PATH = "/oauth/token";
    mockEnvironmentVariables.SUPPLIER_ORDER_PATH = "/order";
    mockEnvironmentVariables.SUPPLIER_CLIENT_ID = "supplier-client";
    mockEnvironmentVariables.SUPPLIER_CLIENT_SECRET_NAME =
      "supplier-oauth-client-secret";
    mockEnvironmentVariables.SUPPLIER_OAUTH_SCOPE = "orders results";
    mockEnvironmentVariables.DATABASE_URL = "postgres://user:pass@host:5432/db";

    process.env.AWS_REGION = "eu-west-2";
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("successful order placement", () => {
    it("should fetch service_url from supplierDb and call order endpoint", async () => {
      mockSupplierAuthGetAccessToken.mockResolvedValue("test-secret");
      mockGetSupplierServiceUrlBySupplierId.mockResolvedValue(mockServiceUrl);

      mockHttpClientPostRaw.mockResolvedValue({
        status: 200,
        text: async () => "{}",
        headers: { get: () => "application/json" },
      });

      mockEvent.body = JSON.stringify({
        supplier_code: validUUID,
        order_body: { resourceType: "ServiceRequest" },
      });

      await handler(mockEvent as APIGatewayProxyEvent, mockContext as Context);

      expect(mockGetSupplierServiceUrlBySupplierId).toHaveBeenCalledWith(
        validUUID,
      );
      expect(mockSupplierAuthGetAccessToken).toHaveBeenCalled();
      expect(mockHttpClientPostRaw).toHaveBeenCalledWith(
        `${mockServiceUrl}/order`,
        JSON.stringify({ resourceType: "ServiceRequest" }),
        expect.objectContaining({
          Authorization: "Bearer test-secret",
          Accept: "application/fhir+json",
          "X-Correlation-ID": expect.any(String),
        }),
        "application/fhir+json",
      );
    });

    it("should trim trailing slash from service_url", async () => {
      mockSupplierAuthGetAccessToken.mockResolvedValue("test-secret");
      mockGetSupplierServiceUrlBySupplierId.mockResolvedValue(
        "http://supplier-url.com/",
      );

      mockHttpClientPostRaw.mockResolvedValue({
        status: 200,
        text: async () => "{}",
        headers: { get: () => "application/json" },
      });

      mockEvent.body = JSON.stringify({
        supplier_code: validUUID,
        order_body: { resourceType: "ServiceRequest" },
      });

      await handler(mockEvent as APIGatewayProxyEvent, mockContext as Context);

      expect(mockGetSupplierServiceUrlBySupplierId).toHaveBeenCalledWith(
        validUUID,
      );
      expect(mockHttpClientPostRaw).toHaveBeenCalledWith(
        "http://supplier-url.com/order",
        expect.any(String),
        expect.any(Object),
        "application/fhir+json",
      );
    });

    it("should use custom order path from environment", async () => {
      mockEnvironmentVariables.SUPPLIER_ORDER_PATH = "/custom/order/endpoint";
      mockSupplierAuthGetAccessToken.mockResolvedValue("token");
      mockGetSupplierServiceUrlBySupplierId.mockResolvedValue(mockServiceUrl);

      mockHttpClientPostRaw.mockResolvedValue({
        status: 201,
        text: async () => "{}",
        headers: { get: () => "application/fhir+json" },
      });

      mockEvent.body = JSON.stringify({
        supplier_code: validUUID,
        order_body: { resourceType: "ServiceRequest" },
      });

      await handler(mockEvent as APIGatewayProxyEvent, mockContext as Context);

      expect(mockHttpClientPostRaw).toHaveBeenCalledWith(
        `${mockServiceUrl}/custom/order/endpoint`,
        JSON.stringify({ resourceType: "ServiceRequest" }),
        expect.any(Object),
        "application/fhir+json",
      );
    });
  });

  describe("correlation ID header pass-through and generation", () => {
    beforeEach(() => {
      mockSupplierAuthGetAccessToken.mockResolvedValue("token");
      mockGetSupplierServiceUrlBySupplierId.mockResolvedValue(mockServiceUrl);
      mockHttpClientPostRaw.mockResolvedValue({
        status: 200,
        text: async () => "{}",
        headers: { get: () => "application/json" },
      });
      mockEvent.body = JSON.stringify({
        supplier_code: validUUID,
        order_body: { resourceType: "ServiceRequest" },
      });
    });

    it("should pass through X-Correlation-ID header", async () => {
      mockEvent.headers = { "X-Correlation-ID": "test-cid-upper" };

      await handler(mockEvent as APIGatewayProxyEvent, mockContext as Context);

      expect(mockHttpClientPostRaw).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          "X-Correlation-ID": "test-cid-upper",
        }),
        expect.any(String),
      );
    });

    it("should pass through x-correlation-id header", async () => {
      mockEvent.headers = { "x-correlation-id": "test-cid-lower" };

      await handler(mockEvent as APIGatewayProxyEvent, mockContext as Context);

      expect(mockHttpClientPostRaw).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          "X-Correlation-ID": "test-cid-lower",
        }),
        expect.any(String),
      );
    });

    it("should generate correlation ID if not provided", async () => {
      mockEvent.headers = {};

      const result = await handler(
        mockEvent as APIGatewayProxyEvent,
        mockContext as Context,
      );

      // Check that the generated correlation ID is a valid UUID
      const correlationId = result.headers?.["X-Correlation-ID"];
      expect(typeof correlationId).toBe("string");
      expect(correlationId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
      expect(mockHttpClientPostRaw).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          "X-Correlation-ID": correlationId,
        }),
        expect.any(String),
      );
    });
  });

  describe("validation and error handling", () => {
    it("should return 400 for invalid JSON in event.body", async () => {
      mockEvent.body = "{ invalid json }";

      const result = await handler(
        mockEvent as APIGatewayProxyEvent,
        mockContext as Context,
      );

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).message).toContain(
        "Invalid JSON in event.body",
      );
    });

    it("should return 400 for missing supplier_code", async () => {
      mockEvent.body = JSON.stringify({
        order_body: { resourceType: "ServiceRequest" },
      });

      const result = await handler(
        mockEvent as APIGatewayProxyEvent,
        mockContext as Context,
      );

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).message).toContain(
        "event.body must match schema",
      );
    });

    it("should return 400 for non-UUID supplier_code", async () => {
      mockEvent.body = JSON.stringify({
        supplier_code: "not-a-uuid",
        order_body: { resourceType: "ServiceRequest" },
      });

      const result = await handler(
        mockEvent as APIGatewayProxyEvent,
        mockContext as Context,
      );

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).message).toContain(
        "event.body must match schema",
      );
    });

    it("should return 400 for missing order_body", async () => {
      mockEvent.body = JSON.stringify({
        supplier_code: validUUID,
      });

      const result = await handler(
        mockEvent as APIGatewayProxyEvent,
        mockContext as Context,
      );

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).message).toContain(
        "event.body must match schema",
      );
    });

    it("should return 400 for null order_body", async () => {
      mockEvent.body = JSON.stringify({
        supplier_code: validUUID,
        order_body: null,
      });

      const result = await handler(
        mockEvent as APIGatewayProxyEvent,
        mockContext as Context,
      );

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).message).toContain(
        "event.body must match schema",
      );
    });

    it("should return 400 for non-object order_body", async () => {
      mockEvent.body = JSON.stringify({
        supplier_code: validUUID,
        order_body: "not-an-object",
      });

      const result = await handler(
        mockEvent as APIGatewayProxyEvent,
        mockContext as Context,
      );

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).message).toContain(
        "event.body must match schema",
      );
    });

    it("should return 404 if supplierDb returns null for service_url", async () => {
      mockGetSupplierServiceUrlBySupplierId.mockResolvedValue(null);

      mockEvent.body = JSON.stringify({
        supplier_code: validUUID,
        order_body: { resourceType: "ServiceRequest" },
      });

      const result = await handler(
        mockEvent as APIGatewayProxyEvent,
        mockContext as Context,
      );

      expect(mockGetSupplierServiceUrlBySupplierId).toHaveBeenCalledWith(
        validUUID,
      );
      expect(result.statusCode).toBe(404);
      expect(JSON.parse(result.body).message).toContain(
        "Supplier not found for supplier_code",
      );
    });

    it("should return 500 when SUPPLIER_ORDER_PATH is missing", async () => {
      mockEnvironmentVariables.SUPPLIER_ORDER_PATH = "";

      mockEvent.body = JSON.stringify({
        supplier_code: validUUID,
        order_body: { resourceType: "ServiceRequest" },
      });

      const result = await handler(
        mockEvent as APIGatewayProxyEvent,
        mockContext as Context,
      );

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).message).toContain(
        "Missing required configuration",
      );
      expect(mockSupplierAuthGetAccessToken).not.toHaveBeenCalled();
      expect(mockGetSupplierServiceUrlBySupplierId).not.toHaveBeenCalled();
    });

    it("should return 500 when SUPPLIER_CLIENT_ID is missing", async () => {
      mockEnvironmentVariables.SUPPLIER_CLIENT_ID = "";

      mockEvent.body = JSON.stringify({
        supplier_code: validUUID,
        order_body: { resourceType: "ServiceRequest" },
      });

      const result = await handler(
        mockEvent as APIGatewayProxyEvent,
        mockContext as Context,
      );

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).message).toContain(
        "Missing required configuration",
      );
    });

    it("should return 500 when SUPPLIER_CLIENT_SECRET_NAME is missing", async () => {
      mockEnvironmentVariables.SUPPLIER_CLIENT_SECRET_NAME = "";

      mockEvent.body = JSON.stringify({
        supplier_code: validUUID,
        order_body: { resourceType: "ServiceRequest" },
      });

      const result = await handler(
        mockEvent as APIGatewayProxyEvent,
        mockContext as Context,
      );

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).message).toContain(
        "Missing required configuration",
      );
    });

    it("should return 500 when SUPPLIER_OAUTH_TOKEN_PATH is missing", async () => {
      mockEnvironmentVariables.SUPPLIER_OAUTH_TOKEN_PATH = "";

      mockEvent.body = JSON.stringify({
        supplier_code: validUUID,
        order_body: { resourceType: "ServiceRequest" },
      });

      const result = await handler(
        mockEvent as APIGatewayProxyEvent,
        mockContext as Context,
      );

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).message).toContain(
        "Missing required configuration",
      );
    });

    it("should return 500 when DATABASE_URL is missing", async () => {
      mockEnvironmentVariables.DATABASE_URL = "";

      mockEvent.body = JSON.stringify({
        supplier_code: validUUID,
        order_body: { resourceType: "ServiceRequest" },
      });

      const result = await handler(
        mockEvent as APIGatewayProxyEvent,
        mockContext as Context,
      );

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).message).toContain(
        "Missing required configuration",
      );
    });

    it("should return error when supplierAuthClient token request fails", async () => {
      const mockErrorResponse = JSON.stringify({ error: "invalid_client" });
      const { HttpError } = require("../lib/http/http-client");

      mockSupplierAuthGetAccessToken.mockRejectedValue(
        new HttpError(
          "HTTP POST request failed with status: 401",
          401,
          mockErrorResponse,
        ),
      );
      mockGetSupplierServiceUrlBySupplierId.mockResolvedValue(mockServiceUrl);

      mockEvent.body = JSON.stringify({
        supplier_code: validUUID,
        order_body: { resourceType: "ServiceRequest" },
      });

      const result = await handler(
        mockEvent as APIGatewayProxyEvent,
        mockContext as Context,
      );

      expect(result.statusCode).toBe(401);
      expect(JSON.parse(result.body).message).toEqual(
        "order-router-lambda: HTTP POST request failed with status: 401",
      );
      expect(JSON.parse(result.body).details).toEqual(mockErrorResponse);
    });

    it("should return error when order request fails", async () => {
      mockSupplierAuthGetAccessToken.mockResolvedValue("token");
      mockGetSupplierServiceUrlBySupplierId.mockResolvedValue(mockServiceUrl);

      const mockErrorResponse = JSON.stringify({
        resourceType: "OperationOutcome",
        issue: [
          {
            severity: "error",
            code: "business-rule",
            details: { text: "Out of stock" },
          },
        ],
      });

      const { HttpError } = require("../lib/http/http-client");

      mockHttpClientPostRaw.mockRejectedValue(
        new HttpError(
          "HTTP POST request failed with status: 409",
          409,
          mockErrorResponse,
        ),
      );

      mockEvent.body = JSON.stringify({
        supplier_code: validUUID,
        order_body: { resourceType: "ServiceRequest" },
      });

      const result = await handler(
        mockEvent as APIGatewayProxyEvent,
        mockContext as Context,
      );

      expect(result.statusCode).toBe(409);
      expect(JSON.parse(result.body).message).toEqual(
        "order-router-lambda: HTTP POST request failed with status: 409",
      );
      expect(JSON.parse(result.body).details).toEqual(mockErrorResponse);
    });
  });
});
