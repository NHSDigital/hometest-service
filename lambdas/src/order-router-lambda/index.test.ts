import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { EnvironmentVariables } from "./init";

// Setup mocks
const mockHttpClientPostRaw = jest.fn();
const mockSupplierAuthGetAccessToken = jest.fn();
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
  })),
}));

// Import handler after mocking
import { handler } from "./index";

describe("order-router-lambda", () => {
  let mockEvent: Partial<APIGatewayProxyEvent>;
  let mockContext: Partial<Context>;

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
        "arn:aws:lambda:eu-west-1:123456789012:function:order-router",
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

    // Set environment variables
    mockEnvironmentVariables.SUPPLIER_BASE_URL = "http://wiremock:8080";
    mockEnvironmentVariables.SUPPLIER_OAUTH_TOKEN_PATH = "/oauth/token";
    mockEnvironmentVariables.SUPPLIER_ORDER_PATH = "/order";
    mockEnvironmentVariables.SUPPLIER_CLIENT_ID = "supplier-client";
    mockEnvironmentVariables.SUPPLIER_CLIENT_SECRET_NAME =
      "supplier-oauth-client-secret";

    process.env.AWS_REGION = "eu-west-1";
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("successful order placement", () => {
    it("should handle base URL with trailing slash", async () => {
      mockEnvironmentVariables.SUPPLIER_BASE_URL = "http://wiremock:8080/";

      mockSupplierAuthGetAccessToken.mockResolvedValue("test-secret");

      mockHttpClientPostRaw.mockResolvedValue({
        status: 200,
        text: async () => "{}",
        headers: { get: () => "application/json" },
      });

      await handler(mockEvent as APIGatewayProxyEvent, mockContext as Context);

      expect(mockSupplierAuthGetAccessToken).toHaveBeenCalled();
      expect(mockHttpClientPostRaw).toHaveBeenCalledWith(
        "http://wiremock:8080/order",
        expect.any(String),
        expect.objectContaining({
          Authorization: "Bearer test-secret",
          Accept: "application/fhir+json",
          "X-Correlation-ID": expect.any(String),
        }),
        "application/fhir+json",
      );
    });

    it("should retrieve OAuth token and call order endpoint successfully", async () => {
      mockSupplierAuthGetAccessToken.mockResolvedValue(
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test",
      );

      const mockOrderRequest = {
        resourceType: "ServiceRequest",
        status: "active",
        intent: "order",
      };

      const mockOrderResponse = {
        resourceType: "ServiceRequest",
        id: "550e8400-e29b-41d4-a716-446655440000",
        status: "active",
        intent: "order",
      };

      mockHttpClientPostRaw.mockResolvedValue({
        status: 201,
        text: async () => JSON.stringify(mockOrderResponse),
        headers: {
          get: (name: string) =>
            name === "content-type" ? "application/fhir+json" : null,
        },
      });

      mockEvent.body = JSON.stringify(mockOrderRequest);
      mockEvent.headers = { "X-Correlation-ID": "test-correlation-id" };

      const result = await handler(
        mockEvent as APIGatewayProxyEvent,
        mockContext as Context,
      );

      expect(result.statusCode).toBe(201);
      expect(result.headers?.["Content-Type"]).toBe("application/fhir+json");
      expect(result.headers?.["X-Correlation-ID"]).toBe("test-correlation-id");
      expect(JSON.parse(result.body)).toEqual(mockOrderResponse);

      expect(mockSupplierAuthGetAccessToken).toHaveBeenCalled();
      expect(mockHttpClientPostRaw).toHaveBeenCalledWith(
        "http://wiremock:8080/order",
        JSON.stringify(mockOrderRequest),
        expect.objectContaining({
          Authorization:
            "Bearer " + "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test",
          Accept: "application/fhir+json",
          "X-Correlation-ID": "test-correlation-id",
        }),
        "application/fhir+json",
      );
    });

    it("should generate correlation ID if not provided", async () => {
      mockSupplierAuthGetAccessToken.mockResolvedValue("token");

      mockHttpClientPostRaw.mockResolvedValue({
        status: 201,
        text: async () => "{}",
        headers: { get: () => "application/fhir+json" },
      });

      mockEvent.headers = {};

      const result = await handler(
        mockEvent as APIGatewayProxyEvent,
        mockContext as Context,
      );

      expect(result.headers?.["X-Correlation-ID"]).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    it("should use custom order path from environment", async () => {
      mockEnvironmentVariables.SUPPLIER_ORDER_PATH = "/custom/order/endpoint";

      mockSupplierAuthGetAccessToken.mockResolvedValue("token");

      mockHttpClientPostRaw.mockResolvedValue({
        status: 201,
        text: async () => "{}",
        headers: { get: () => "application/fhir+json" },
      });

      await handler(mockEvent as APIGatewayProxyEvent, mockContext as Context);

      expect(mockHttpClientPostRaw).toHaveBeenCalledWith(
        "http://wiremock:8080/custom/order/endpoint",
        expect.any(String),
        expect.any(Object),
        "application/fhir+json",
      );
    });
  });

  describe("error handling", () => {
    it("should return 500 when SUPPLIER_BASE_URL is missing", async () => {
      mockEnvironmentVariables.SUPPLIER_BASE_URL = "";

      const result = await handler(
        mockEvent as APIGatewayProxyEvent,
        mockContext as Context,
      );

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).message).toContain(
        "Missing required configuration",
      );
      expect(mockSupplierAuthGetAccessToken).not.toHaveBeenCalled();
    });

    it("should return 500 when SUPPLIER_CLIENT_ID is missing", async () => {
      mockEnvironmentVariables.SUPPLIER_CLIENT_ID = "";

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
