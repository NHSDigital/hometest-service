import {
  isUUID,
  getCorrelationIdFromEventHeaders,
  createJsonResponse,
  retrieveMandatoryEnvVariable,
  retrieveMandatoryJsonEnvVariable,
  retrieveOptionalEnvVariable,
  calculateAge,
  isNullOrUndefined,
  ensureDefined,
  generateRandomString,
  isInRange,
  roundTo1dp,
  titleCase,
  validateUrlSource,
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

describe("retrieveMandatoryEnvVariable", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("should return the value when environment variable is set", () => {
    process.env.TEST_VAR = "test-value";
    expect(retrieveMandatoryEnvVariable("TEST_VAR")).toBe("test-value");
  });

  it("should throw error when environment variable is not set", () => {
    delete process.env.TEST_VAR;
    expect(() => retrieveMandatoryEnvVariable("TEST_VAR")).toThrow(
      "Missing value for an environment variable TEST_VAR",
    );
  });

  it("should throw error when environment variable is empty string", () => {
    process.env.TEST_VAR = "";
    expect(() => retrieveMandatoryEnvVariable("TEST_VAR")).toThrow(
      "Missing value for an environment variable TEST_VAR",
    );
  });
});

describe("retrieveMandatoryJsonEnvVariable", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("should parse and return valid JSON from environment variable", () => {
    process.env.TEST_JSON = '{"key": "value", "number": 42}';
    const result = retrieveMandatoryJsonEnvVariable<{
      key: string;
      number: number;
    }>("TEST_JSON");
    expect(result).toEqual({ key: "value", number: 42 });
  });

  it("should throw error when JSON is invalid", () => {
    process.env.TEST_JSON = "not-valid-json";
    expect(() => retrieveMandatoryJsonEnvVariable("TEST_JSON")).toThrow(
      "Error while parsing env var TEST_JSON as JSON",
    );
  });

  it("should throw error when environment variable is not set", () => {
    delete process.env.TEST_JSON;
    expect(() => retrieveMandatoryJsonEnvVariable("TEST_JSON")).toThrow(
      "Missing value for an environment variable TEST_JSON",
    );
  });
});

describe("retrieveOptionalEnvVariable", () => {
  const originalEnv = process.env;
  const originalLog = console.log;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    console.log = jest.fn();
  });

  afterAll(() => {
    process.env = originalEnv;
    console.log = originalLog;
  });

  it("should return the value when environment variable is set", () => {
    process.env.TEST_VAR = "test-value";
    expect(retrieveOptionalEnvVariable("TEST_VAR")).toBe("test-value");
  });

  it("should return empty string when environment variable is not set and no default provided", () => {
    delete process.env.TEST_VAR;
    expect(retrieveOptionalEnvVariable("TEST_VAR")).toBe("");
    expect(console.log).toHaveBeenCalledWith(
      "The environment variable TEST_VAR has not been provided for the lambda",
    );
  });

  it("should return default value when environment variable is not set", () => {
    delete process.env.TEST_VAR;
    expect(retrieveOptionalEnvVariable("TEST_VAR", "default-value")).toBe(
      "default-value",
    );
  });

  it("should return the actual value even when default is provided", () => {
    process.env.TEST_VAR = "actual-value";
    expect(retrieveOptionalEnvVariable("TEST_VAR", "default-value")).toBe(
      "actual-value",
    );
  });
});

describe("calculateAge", () => {
  it("should calculate age correctly for past birthdate", () => {
    const birthdate = new Date("1990-01-01");
    const age = calculateAge(birthdate);
    expect(age).toBeGreaterThanOrEqual(36);
  });

  it("should return 0 for today's birthdate", () => {
    const today = new Date();
    expect(calculateAge(today)).toBe(0);
  });

  it("should calculate age for birthdate 20 years ago", () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 20);
    expect(calculateAge(date)).toBe(20);
  });
});

describe("isNullOrUndefined", () => {
  it("should return true for null", () => {
    expect(isNullOrUndefined(null)).toBe(true);
  });

  it("should return true for undefined", () => {
    expect(isNullOrUndefined(undefined)).toBe(true);
  });

  it("should return false for defined values", () => {
    expect(isNullOrUndefined(0)).toBe(false);
    expect(isNullOrUndefined("")).toBe(false);
    expect(isNullOrUndefined(false)).toBe(false);
    expect(isNullOrUndefined([])).toBe(false);
    expect(isNullOrUndefined({})).toBe(false);
  });
});

describe("ensureDefined", () => {
  it("should return value when defined", () => {
    expect(ensureDefined("test")).toBe("test");
    expect(ensureDefined(0)).toBe(0);
    expect(ensureDefined(false)).toBe(false);
  });

  it("should throw default error when value is undefined", () => {
    expect(() => ensureDefined(undefined)).toThrow("Value is undefined");
  });

  it("should throw custom error when value is undefined", () => {
    expect(() => ensureDefined(undefined, "Custom error message")).toThrow(
      "Custom error message",
    );
  });
});

describe("generateRandomString", () => {
  it("should generate string of correct length", () => {
    expect(generateRandomString(10).length).toBe(10);
    expect(generateRandomString(20).length).toBe(20);
    expect(generateRandomString(0).length).toBe(0);
  });

  it("should generate string with only valid characters", () => {
    const result = generateRandomString(100);
    expect(result).toMatch(/^[A-Za-z0-9]*$/);
  });

  it("should generate different strings on multiple calls", () => {
    const string1 = generateRandomString(50);
    const string2 = generateRandomString(50);
    expect(string1).not.toBe(string2);
  });
});

describe("isInRange", () => {
  it("should return true when value is in range", () => {
    expect(isInRange(0, 10, 5)).toBe(true);
    expect(isInRange(0, 10, 0)).toBe(true);
    expect(isInRange(0, 10, 10)).toBe(true);
  });

  it("should return false when value is out of range", () => {
    expect(isInRange(0, 10, -1)).toBe(false);
    expect(isInRange(0, 10, 11)).toBe(false);
    expect(isInRange(0, 10, 100)).toBe(false);
  });
});

describe("roundTo1dp", () => {
  it("should round to 1 decimal place", () => {
    expect(roundTo1dp(1.23)).toBe(1.2);
    expect(roundTo1dp(1.26)).toBe(1.3);
    expect(roundTo1dp(1.25)).toBe(1.3);
    expect(roundTo1dp(1.0)).toBe(1.0);
  });

  it("should handle negative numbers", () => {
    expect(roundTo1dp(-1.23)).toBe(-1.2);
    expect(roundTo1dp(-1.26)).toBe(-1.3);
  });
});

describe("titleCase", () => {
  it("should convert string to title case", () => {
    expect(titleCase("hello world")).toBe("Hello World");
    expect(titleCase("HELLO WORLD")).toBe("Hello World");
  });

  it("should keep NHS uppercase", () => {
    expect(titleCase("nhs login")).toBe("NHS Login");
    expect(titleCase("the nhs service")).toBe("The NHS Service");
  });

  it("should keep UK uppercase", () => {
    expect(titleCase("uk address")).toBe("UK Address");
    expect(titleCase("united kingdom")).toBe("United Kingdom");
  });

  it("should handle flat numbers correctly", () => {
    expect(titleCase("10a main street")).toBe("10A Main Street");
    expect(titleCase("flat 5b")).toBe("Flat 5B");
  });

  it("should handle mixed case input", () => {
    expect(titleCase("MiXeD CaSe")).toBe("Mixed Case");
  });
});

describe("validateUrlSource", () => {
  it("should return uppercase 2-letter code for valid input", () => {
    expect(validateUrlSource("ab")).toBe("AB");
    expect(validateUrlSource("AB")).toBe("AB");
    expect(validateUrlSource("aB")).toBe("AB");
  });

  it("should handle whitespace", () => {
    expect(validateUrlSource(" ab ")).toBe("AB");
    expect(validateUrlSource("ab ")).toBe("AB");
    expect(validateUrlSource(" ab")).toBe("AB");
  });

  it("should return undefined for invalid input", () => {
    expect(validateUrlSource(undefined)).toBeUndefined();
    expect(validateUrlSource("")).toBeUndefined();
    expect(validateUrlSource("   ")).toBeUndefined();
    expect(validateUrlSource("a")).toBeUndefined();
    expect(validateUrlSource("abc")).toBeUndefined();
    expect(validateUrlSource("a1")).toBeUndefined();
    expect(validateUrlSource("12")).toBeUndefined();
    expect(validateUrlSource("a ")).toBeUndefined();
  });
});
