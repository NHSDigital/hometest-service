import {
  isUUID,
  getCorrelationIdFromEventHeaders,
  createJsonResponse,
} from "./utils";
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
  const mockEvent = (
    headers: Record<string, string>,
  ): APIGatewayProxyEvent => ({
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

  it("returns X-Correlation-ID header when present and valid", () => {
    const event = mockEvent({
      "X-Correlation-ID": "123e4567-e89b-12d3-a456-426614174000",
    });
    expect(getCorrelationIdFromEventHeaders(event)).toBe(
      "123e4567-e89b-12d3-a456-426614174000",
    );
  });

  it("returns x-correlation-id header when present and valid", () => {
    const event = mockEvent({
      "x-correlation-id": "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(getCorrelationIdFromEventHeaders(event)).toBe(
      "550e8400-e29b-41d4-a716-446655440000",
    );
  });

  it("prioritizes X-Correlation-ID over x-correlation-id when both present and valid", () => {
    const event = mockEvent({
      "X-Correlation-ID": "123e4567-e89b-12d3-a456-426614174000",
      "x-correlation-id": "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(getCorrelationIdFromEventHeaders(event)).toBe(
      "123e4567-e89b-12d3-a456-426614174000",
    );
  });

  it("throws when no correlation ID header exists", () => {
    const event = mockEvent({});
    expect(() => getCorrelationIdFromEventHeaders(event)).toThrow(
      "Correlation ID is missing or invalid in the event headers. Expected a valid UUID in 'X-Correlation-ID' or 'x-correlation-id'.",
    );
  });

  it("throws when headers object has other headers but no correlation ID", () => {
    const event = mockEvent({ "Content-Type": "application/json" });
    expect(() => getCorrelationIdFromEventHeaders(event)).toThrow(
      "Correlation ID is missing or invalid in the event headers. Expected a valid UUID in 'X-Correlation-ID' or 'x-correlation-id'.",
    );
  });

  it("throws when correlation ID header is present but invalid", () => {
    const event = mockEvent({ "X-Correlation-ID": "not-a-uuid" });
    expect(() => getCorrelationIdFromEventHeaders(event)).toThrow(
      "Correlation ID is missing or invalid in the event headers. Expected a valid UUID in 'X-Correlation-ID' or 'x-correlation-id'.",
    );
  });
});

describe("createJsonResponse", () => {
  it("should return a valid APIGatewayProxyResult with correct status, headers, and body", () => {
    const statusCode = 201;
    const body = { message: "Success", data: { foo: "bar" } };
    const result = createJsonResponse(statusCode, body);

    expect(result.statusCode).toBe(statusCode);
    expect(result.headers).toEqual({ "Content-Type": "application/json" });
    expect(result.body).toBe(JSON.stringify(body));
  });

  it("should serialize empty object correctly", () => {
    const result = createJsonResponse(200, {});
    expect(result.body).toBe("{}");
  });

  it("should handle nested objects and arrays", () => {
    const body = { arr: [1, 2, 3], nested: { a: 1 } };
    const result = createJsonResponse(200, body);
    expect(result.body).toBe(JSON.stringify(body));
  });
});
