import { isUUID, getCorrelationIdFromEventHeaders } from "./utils";
import { APIGatewayProxyEvent } from "aws-lambda/trigger/api-gateway-proxy";

describe("isUUID", () => {
  it("returns true for valid UUIDs", () => {
    expect(isUUID("123e4567-e89b-12d3-a456-426614174000")).toBe(true);
    expect(isUUID("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
    expect(isUUID("f47ac10b-58cc-4372-a567-0e02b2c3d479")).toBe(true);
  });

  it("returns false for invalid UUIDs", () => {
    expect(isUUID("not-a-uuid")).toBe(false);
    expect(isUUID("123e4567e89b12d3a456426614174000")).toBe(false);
    expect(isUUID("123e4567-e89b-12d3-a456-42661417400")).toBe(false); // too short
    expect(isUUID("123e4567-e89b-12d3-a456-4266141740000")).toBe(false); // too long
    expect(isUUID("123e4567-e89b-62d3-a456-426614174000")).toBe(false); // invalid version
    expect(isUUID("")).toBe(false);
    expect(isUUID(null as unknown as string)).toBe(false);
    expect(isUUID(undefined as unknown as string)).toBe(false);
  });
});

describe("getCorrelationIdFromEventHeaders", () => {
  const mockEvent = (headers: Record<string, string>): APIGatewayProxyEvent => ({
    headers,
    body: null,
    httpMethod: "GET",
    isBase64Encoded: false,
    path: "/test",
    pathParameters: null,
    queryStringParameters: null,
    multiValueHeaders: {},
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {} as any,
    resource: "",
  });

  beforeEach(() => {
    jest.spyOn(crypto, "randomUUID").mockReturnValue("550e8400-e29b-41d4-a716-446655440000" as `${string}-${string}-${string}-${string}-${string}`);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns X-Correlation-ID header when present", () => {
    const event = mockEvent({ "X-Correlation-ID": "test-correlation-id" });
    expect(getCorrelationIdFromEventHeaders(event)).toBe("test-correlation-id");
  });

  it("returns x-correlation-id header when present", () => {
    const event = mockEvent({ "x-correlation-id": "lowercase-correlation-id" });
    expect(getCorrelationIdFromEventHeaders(event)).toBe("lowercase-correlation-id");
  });

  it("prioritizes X-Correlation-ID over x-correlation-id when both present", () => {
    const event = mockEvent({
      "X-Correlation-ID": "uppercase-id",
      "x-correlation-id": "lowercase-id",
    });
    expect(getCorrelationIdFromEventHeaders(event)).toBe("uppercase-id");
  });

  it("generates new UUID when no correlation ID header exists", () => {
    const event = mockEvent({});
    expect(getCorrelationIdFromEventHeaders(event)).toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(crypto.randomUUID).toHaveBeenCalledTimes(1);
  });

  it("generates new UUID when headers object has other headers", () => {
    const event = mockEvent({ "Content-Type": "application/json" });
    expect(getCorrelationIdFromEventHeaders(event)).toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(crypto.randomUUID).toHaveBeenCalledTimes(1);
  });
});
