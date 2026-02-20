import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

import { TestResult } from "../lib/db/test-result-db-client";
import { lambdaHandler } from "./index";

jest.mock("../lib/db/test-result-db-client");

const mockGetResult = jest.fn();

jest.mock("./init", () => ({
  init: jest.fn(() => ({
    testResultDbClient: {
      getResult: mockGetResult,
    },
  })),
}));

describe("Get Results Lambda Handler", () => {
  let mockEvent: Partial<APIGatewayProxyEvent>;
  let mockTestResult: TestResult;

  beforeEach(() => {
    mockEvent = {
      httpMethod: "GET",
      path: "/results",
      queryStringParameters: {
        order_id: "123e4567-e89b-12d3-a456-426614174000",
        nhs_number: "1234567890",
        date_of_birth: "1990-01-15",
      },
      headers: {},
    };

    mockTestResult = {
      id: "result-123e4567-e89b-12d3-a456-426614174000",
      status: "RESULT_AVAILABLE",
      created_at: new Date("2024-01-20T14:30:00Z"),
      order_id: "123e4567-e89b-12d3-a456-426614174000",
      test_code: "31676001",
      test_description: "HIV antigen test",
      supplier_id: "SUP001",
      supplier_name: "Test Supplier Ltd",
      patient_id: "pat-123e4567-e89b-12d3-a456-426614174000",
    };

    mockGetResult.mockReset();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const getObservationFromResult = (result: APIGatewayProxyResult) => {
    return JSON.parse(result.body);
  };

  describe("Success scenarios", () => {
    test("should return observation when valid query parameters are provided and result is available", async () => {
      mockGetResult.mockResolvedValue(mockTestResult);

      const result = await lambdaHandler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(200);
      expect(result.headers).toEqual({
        "Content-Type": "application/fhir+json",
      });

      const observation = getObservationFromResult(result);
      expect(observation.resourceType).toBe("Observation");
      expect(observation.id).toBe(mockTestResult.id);
      expect(observation.status).toBe("final");

      expect(mockGetResult).toHaveBeenCalledWith(
        "123e4567-e89b-12d3-a456-426614174000",
        "1234567890",
        new Date("1990-01-15"),
      );
    });

    test("should handle NHS number with spaces by removing them", async () => {
      mockEvent.queryStringParameters = {
        order_id: "123e4567-e89b-12d3-a456-426614174000",
        nhs_number: "123 456 7890",
        date_of_birth: "1990-01-15",
      };

      mockGetResult.mockResolvedValue(mockTestResult);

      const result = await lambdaHandler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(200);
      expect(mockGetResult).toHaveBeenCalledWith(
        "123e4567-e89b-12d3-a456-426614174000",
        "1234567890",
        new Date("1990-01-15"),
      );
    });

    test("should convert uppercase UUID to lowercase", async () => {
      mockEvent.queryStringParameters = {
        order_id: "123E4567-E89B-12D3-A456-426614174000",
        nhs_number: "1234567890",
        date_of_birth: "1990-01-15",
      };

      mockGetResult.mockResolvedValue(mockTestResult);

      const result = await lambdaHandler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(200);
      expect(mockGetResult).toHaveBeenCalledWith(
        "123e4567-e89b-12d3-a456-426614174000",
        "1234567890",
        new Date("1990-01-15"),
      );
    });
  });

  describe("Not found scenarios", () => {
    test("should return 404 when result does not exist", async () => {
      mockGetResult.mockResolvedValue(null);

      const result = await lambdaHandler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(404);
      expect(result.headers).toEqual({
        "Content-Type": "application/fhir+json",
      });

      const responseBody = JSON.parse(result.body);
      expect(responseBody.resourceType).toBe("OperationOutcome");
      expect(responseBody.issue).toHaveLength(1);
      expect(responseBody.issue[0]).toMatchObject({
        severity: "error",
        code: "not-found",
        diagnostics: "The requested resource could not be found",
      });
    });

    test("should return 404 when result status is RESULT_WITHHELD", async () => {
      mockTestResult.status = "RESULT_WITHHELD";
      mockGetResult.mockResolvedValue(mockTestResult);

      const result = await lambdaHandler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(404);
      expect(result.headers).toEqual({
        "Content-Type": "application/fhir+json",
      });

      const responseBody = JSON.parse(result.body);
      expect(responseBody.resourceType).toBe("OperationOutcome");
      expect(responseBody.issue).toHaveLength(1);
      expect(responseBody.issue[0]).toMatchObject({
        severity: "error",
        code: "not-found",
        diagnostics: "The requested resource could not be found",
      });
    });
  });

  describe("Validation scenarios - order_id", () => {
    test("should return 400 when order_id is missing", async () => {
      mockEvent.queryStringParameters = {
        nhs_number: "1234567890",
        date_of_birth: "1990-01-15",
      };

      const result = await lambdaHandler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);

      const responseBody = JSON.parse(result.body);
      expect(responseBody.resourceType).toBe("OperationOutcome");
      expect(responseBody.issue[0]).toMatchObject({
        severity: "error",
        code: "invalid",
      });
      expect(responseBody.issue[0].diagnostics).toContain("order_id");
    });

    test("should return 400 when order_id is not a valid UUID", async () => {
      mockEvent.queryStringParameters = {
        order_id: "not-a-uuid",
        nhs_number: "1234567890",
        date_of_birth: "1990-01-15",
      };

      const result = await lambdaHandler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);

      const responseBody = JSON.parse(result.body);
      expect(responseBody.resourceType).toBe("OperationOutcome");
      expect(responseBody.issue[0]).toMatchObject({
        severity: "error",
        code: "invalid",
      });
      expect(responseBody.issue[0].diagnostics).toContain("order_id");
      expect(responseBody.issue[0].diagnostics).toContain("Invalid");
    });

    test("should return 400 when order_id is empty string", async () => {
      mockEvent.queryStringParameters = {
        order_id: "",
        nhs_number: "1234567890",
        date_of_birth: "1990-01-15",
      };

      const result = await lambdaHandler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);

      const responseBody = JSON.parse(result.body);
      expect(responseBody.resourceType).toBe("OperationOutcome");
      expect(responseBody.issue[0]).toMatchObject({
        severity: "error",
        code: "invalid",
      });
    });
  });

  describe("Validation scenarios - nhs_number", () => {
    test("should return 400 when nhs_number is missing", async () => {
      mockEvent.queryStringParameters = {
        order_id: "123e4567-e89b-12d3-a456-426614174000",
        date_of_birth: "1990-01-15",
      };

      const result = await lambdaHandler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);

      const responseBody = JSON.parse(result.body);
      expect(responseBody.resourceType).toBe("OperationOutcome");
      expect(responseBody.issue[0]).toMatchObject({
        severity: "error",
        code: "invalid",
      });
      expect(responseBody.issue[0].diagnostics).toContain("nhs_number");
    });

    test("should return 400 when nhs_number is not 10 digits", async () => {
      mockEvent.queryStringParameters = {
        order_id: "123e4567-e89b-12d3-a456-426614174000",
        nhs_number: "123456789", // 9 digits
        date_of_birth: "1990-01-15",
      };

      const result = await lambdaHandler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);

      const responseBody = JSON.parse(result.body);
      expect(responseBody.resourceType).toBe("OperationOutcome");
      expect(responseBody.issue[0]).toMatchObject({
        severity: "error",
        code: "invalid",
      });
      expect(responseBody.issue[0].diagnostics).toContain("nhs_number");
      expect(responseBody.issue[0].diagnostics).toContain("10 digits");
    });

    test("should return 400 when nhs_number contains non-numeric characters", async () => {
      mockEvent.queryStringParameters = {
        order_id: "123e4567-e89b-12d3-a456-426614174000",
        nhs_number: "12345678AB",
        date_of_birth: "1990-01-15",
      };

      const result = await lambdaHandler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);

      const responseBody = JSON.parse(result.body);
      expect(responseBody.resourceType).toBe("OperationOutcome");
      expect(responseBody.issue[0]).toMatchObject({
        severity: "error",
        code: "invalid",
      });
      expect(responseBody.issue[0].diagnostics).toContain("nhs_number");
    });

    test("should return 400 when nhs_number is too long", async () => {
      mockEvent.queryStringParameters = {
        order_id: "123e4567-e89b-12d3-a456-426614174000",
        nhs_number: "12345678901", // 11 digits
        date_of_birth: "1990-01-15",
      };

      const result = await lambdaHandler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);

      const responseBody = JSON.parse(result.body);
      expect(responseBody.resourceType).toBe("OperationOutcome");
      expect(responseBody.issue[0]).toMatchObject({
        severity: "error",
        code: "invalid",
      });
    });
  });

  describe("Validation scenarios - date_of_birth", () => {
    test("should return 400 when date_of_birth is missing", async () => {
      mockEvent.queryStringParameters = {
        order_id: "123e4567-e89b-12d3-a456-426614174000",
        nhs_number: "1234567890",
      };

      const result = await lambdaHandler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);

      const responseBody = JSON.parse(result.body);
      expect(responseBody.resourceType).toBe("OperationOutcome");
      expect(responseBody.issue[0]).toMatchObject({
        severity: "error",
        code: "invalid",
      });
      expect(responseBody.issue[0].diagnostics).toContain("date_of_birth");
    });

    test("should return 400 when date_of_birth is not in yyyy-mm-dd format", async () => {
      mockEvent.queryStringParameters = {
        order_id: "123e4567-e89b-12d3-a456-426614174000",
        nhs_number: "1234567890",
        date_of_birth: "15/01/1990",
      };

      const result = await lambdaHandler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);

      const responseBody = JSON.parse(result.body);
      expect(responseBody.resourceType).toBe("OperationOutcome");
      expect(responseBody.issue[0]).toMatchObject({
        severity: "error",
        code: "invalid",
      });
      expect(responseBody.issue[0].diagnostics).toContain("date_of_birth");
      expect(responseBody.issue[0].diagnostics).toContain("yyyy-mm-dd");
    });

    test("should return 400 when date_of_birth is not a valid date", async () => {
      mockEvent.queryStringParameters = {
        order_id: "123e4567-e89b-12d3-a456-426614174000",
        nhs_number: "1234567890",
        date_of_birth: "1990-13-45", // Invalid month and day
      };

      const result = await lambdaHandler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);

      const responseBody = JSON.parse(result.body);
      expect(responseBody.resourceType).toBe("OperationOutcome");
      expect(responseBody.issue[0]).toMatchObject({
        severity: "error",
        code: "invalid",
      });
      expect(responseBody.issue[0].diagnostics).toContain("date_of_birth");
    });

    test("should return 400 when date_of_birth is empty string", async () => {
      mockEvent.queryStringParameters = {
        order_id: "123e4567-e89b-12d3-a456-426614174000",
        nhs_number: "1234567890",
        date_of_birth: "",
      };

      const result = await lambdaHandler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);

      const responseBody = JSON.parse(result.body);
      expect(responseBody.resourceType).toBe("OperationOutcome");
      expect(responseBody.issue[0]).toMatchObject({
        severity: "error",
        code: "invalid",
      });
    });
  });

  describe("Validation scenarios - multiple errors", () => {
    test("should return 400 with all validation errors when all parameters are invalid", async () => {
      mockEvent.queryStringParameters = {
        order_id: "invalid-uuid",
        nhs_number: "123",
        date_of_birth: "invalid-date",
      };

      const result = await lambdaHandler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);

      const responseBody = JSON.parse(result.body);
      expect(responseBody.resourceType).toBe("OperationOutcome");
      expect(responseBody.issue[0]).toMatchObject({
        severity: "error",
        code: "invalid",
      });

      const diagnostics = responseBody.issue[0].diagnostics;
      expect(diagnostics).toContain("order_id");
      expect(diagnostics).toContain("nhs_number");
      expect(diagnostics).toContain("date_of_birth");
    });
  });

  describe("Edge cases", () => {
    test("should handle null queryStringParameters", async () => {
      mockEvent.queryStringParameters = null;

      const result = await lambdaHandler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);

      const responseBody = JSON.parse(result.body);
      expect(responseBody.resourceType).toBe("OperationOutcome");
      expect(responseBody.issue[0]).toMatchObject({
        severity: "error",
        code: "invalid",
      });
    });

    test("should handle undefined queryStringParameters", async () => {
      mockEvent.queryStringParameters = undefined;

      const result = await lambdaHandler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);

      const responseBody = JSON.parse(result.body);
      expect(responseBody.resourceType).toBe("OperationOutcome");
      expect(responseBody.issue[0]).toMatchObject({
        severity: "error",
        code: "invalid",
      });
    });
  });
});
