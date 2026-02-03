import { APIGatewayProxyEvent, Context } from "aws-lambda";

// Setup mocks
const mockSend = jest.fn();

jest.mock("@aws-sdk/client-secrets-manager", () => {
  return {
    SecretsManagerClient: jest.fn().mockImplementation(() => ({
      send: mockSend,
    })),
    GetSecretValueCommand: jest.fn().mockImplementation((params) => params),
  };
});

// Import handler after mocking
import { handler } from "./index";
import { GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

// Mock fetch
global.fetch = jest.fn() as any;

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
    mockSend.mockReset();
    (global.fetch as jest.Mock).mockReset();

    // Set environment variables
    process.env.SUPPLIER_BASE_URL = "http://wiremock:8080";
    process.env.SUPPLIER_OAUTH_TOKEN_PATH = "/oauth/token";
    process.env.SUPPLIER_ORDER_PATH = "/order";
    process.env.SUPPLIER_CLIENT_ID = "supplier-client";
    process.env.SUPPLIER_CLIENT_SECRET_NAME = "supplier-oauth-client-secret";
    process.env.AWS_REGION = "eu-west-1";
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.SUPPLIER_BASE_URL;
    delete process.env.SUPPLIER_OAUTH_TOKEN_PATH;
    delete process.env.SUPPLIER_CLIENT_ID;
    delete process.env.SUPPLIER_CLIENT_SECRET_NAME;
    delete process.env.SUPPLIER_ORDER_PATH;
  });

  describe("successful order placement", () => {
    it("should use custom token path from environment", async () => {
      process.env.SUPPLIER_OAUTH_TOKEN_PATH = "/custom/token/endpoint";

      mockSend.mockResolvedValue({
        SecretString: JSON.stringify({ client_secret: "test-secret" }),
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ access_token: "token" }),
        headers: {
          get: () => "application/json",
        },
      });

      await handler(mockEvent as APIGatewayProxyEvent, mockContext as Context);

      expect(global.fetch).toHaveBeenCalledWith(
        "http://wiremock:8080/custom/token/endpoint",
        expect.any(Object),
      );
    });

    it("should handle base URL with trailing slash", async () => {
      process.env.SUPPLIER_BASE_URL = "http://wiremock:8080/";

      mockSend.mockResolvedValue({
        SecretString: JSON.stringify({ client_secret: "test-secret" }),
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ access_token: "token" }),
        headers: {
          get: () => "application/json",
        },
      });

      await handler(mockEvent as APIGatewayProxyEvent, mockContext as Context);

      expect(global.fetch).toHaveBeenCalledWith(
        "http://wiremock:8080/oauth/token",
        expect.any(Object),
      );
    });

    it("should retrieve OAuth token and call order endpoint successfully", async () => {
      const mockSecret = JSON.stringify({ client_secret: "test-secret-123" });
      mockSend.mockResolvedValue({
        SecretString: mockSecret,
      });

      const mockTokenResponse = {
        access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test",
        token_type: "Bearer",
        expires_in: 3600,
      };

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

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockTokenResponse,
          headers: {
            get: () => "application/json",
          },
        })
        .mockResolvedValueOnce({
          ok: true,
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

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        "http://wiremock:8080/order",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer " + mockTokenResponse.access_token,
            "Content-Type": "application/fhir+json",
            Accept: "application/fhir+json",
            "X-Correlation-ID": "test-correlation-id",
          }),
          body: JSON.stringify(mockOrderRequest),
        }),
      );
    });

    it("should generate correlation ID if not provided", async () => {
      mockSend.mockResolvedValue({
        SecretString: JSON.stringify({ client_secret: "test-secret" }),
      });

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ access_token: "token" }),
          headers: { get: () => "application/json" },
        })
        .mockResolvedValueOnce({
          ok: true,
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
      process.env.SUPPLIER_ORDER_PATH = "/custom/order/endpoint";

      mockSend.mockResolvedValue({
        SecretString: JSON.stringify({ client_secret: "test-secret" }),
      });

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ access_token: "token" }),
          headers: { get: () => "application/json" },
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          text: async () => "{}",
          headers: { get: () => "application/fhir+json" },
        });

      await handler(mockEvent as APIGatewayProxyEvent, mockContext as Context);

      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        "http://wiremock:8080/custom/order/endpoint",
        expect.any(Object),
      );
    });
  });

  describe("error handling", () => {
    it("should return 500 when SUPPLIER_BASE_URL is missing", async () => {
      delete process.env.SUPPLIER_BASE_URL;

      const result = await handler(
        mockEvent as APIGatewayProxyEvent,
        mockContext as Context,
      );

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).message).toContain(
        "Missing required configuration",
      );
      expect(mockSend).not.toHaveBeenCalled();
    });

    it("should return 500 when SUPPLIER_CLIENT_ID is missing", async () => {
      delete process.env.SUPPLIER_CLIENT_ID;

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
      delete process.env.SUPPLIER_CLIENT_SECRET_NAME;

      const result = await handler(
        mockEvent as APIGatewayProxyEvent,
        mockContext as Context,
      );

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).message).toContain(
        "Missing required configuration",
      );
    });

    it("should return 500 when secret string is empty", async () => {
      mockSend.mockResolvedValue({
        SecretString: "",
      });

      const result = await handler(
        mockEvent as APIGatewayProxyEvent,
        mockContext as Context,
      );

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).message).toContain(
        "Secret string is empty",
      );
    });

    it("should return 500 when secret JSON is missing client_secret", async () => {
      mockSend.mockResolvedValue({
        SecretString: JSON.stringify({ other_field: "value" }),
      });

      const result = await handler(
        mockEvent as APIGatewayProxyEvent,
        mockContext as Context,
      );

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).message).toContain(
        "client_secret missing in secret JSON",
      );
    });

    it("should return 500 when SecretsManager throws error", async () => {
      mockSend.mockRejectedValue(new Error("Secret not found"));

      const result = await handler(
        mockEvent as APIGatewayProxyEvent,
        mockContext as Context,
      );

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).message).toContain("Secret not found");
    });

    it("should return error when OAuth token request fails", async () => {
      mockSend.mockResolvedValue({
        SecretString: JSON.stringify({ client_secret: "test-secret" }),
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => JSON.stringify({ error: "invalid_client" }),
        headers: { get: () => "application/json" },
      });

      const result = await handler(
        mockEvent as APIGatewayProxyEvent,
        mockContext as Context,
      );

      expect(result.statusCode).toBe(401);
      expect(JSON.parse(result.body).message).toContain(
        "OAuth token request failed",
      );
    });

    it("should handle order endpoint errors", async () => {
      mockSend.mockResolvedValue({
        SecretString: JSON.stringify({ client_secret: "test-secret" }),
      });

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ access_token: "token" }),
          headers: { get: () => "application/json" },
        })
        .mockResolvedValueOnce({
          ok: false,
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

      const result = await handler(
        mockEvent as APIGatewayProxyEvent,
        mockContext as Context,
      );

      expect(result.statusCode).toBe(409);
      expect(result.headers?.["Content-Type"]).toBe("application/fhir+json");
    });

    it("should handle fetch network errors", async () => {
      mockSend.mockResolvedValue({
        SecretString: JSON.stringify({ client_secret: "test-secret" }),
      });

      (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

      const result = await handler(
        mockEvent as APIGatewayProxyEvent,
        mockContext as Context,
      );

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).message).toContain("Network error");
    });
  });
});
