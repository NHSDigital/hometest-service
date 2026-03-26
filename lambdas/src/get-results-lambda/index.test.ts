// sort-imports-ignore
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { Bundle, Observation } from "fhir/r4";

import { TestResult } from "../lib/db/test-result-db-client";

jest.mock("../lib/db/test-result-db-client");

const mockGetResult = jest.fn();
const mockGetResults = jest.fn();
const mockGetCorrelationIdFromEventHeaders = jest.fn();

jest.mock("./init", () => ({
  init: jest.fn(() => ({
    testResultDbClient: {
      getResult: mockGetResult,
    },
    supplierTestResultsService: {
      getResults: mockGetResults,
    },
  })),
}));

jest.mock("../lib/utils/utils", () => ({
  ...jest.requireActual("../lib/utils/utils"),
  getCorrelationIdFromEventHeaders: () => mockGetCorrelationIdFromEventHeaders(),
}));

import { lambdaHandler } from "./index";

describe("Get Results Lambda Handler", () => {
  let mockEvent: Partial<APIGatewayProxyEvent>;
  let mockTestResult: TestResult;
  let mockBundle: Bundle<Observation>;
  let expectedObservation: Observation;
  const testCorrelationId = "550e8400-e29b-41d4-a716-446655440099";

  beforeEach(() => {
    mockEvent = {
      httpMethod: "GET",
      path: "/results",
      queryStringParameters: {
        order_id: "123e4567-e89b-12d3-a456-426614174000",
        nhs_number: "1234567890",
        date_of_birth: "1990-01-15",
      },
      headers: {
        "X-Correlation-ID": testCorrelationId,
      },
    };

    mockTestResult = {
      id: 123,
      status: "RESULT_AVAILABLE",
      supplier_id: "SUP001",
    };

    expectedObservation = {
      resourceType: "Observation",
      id: "550e8400-e29b-41d4-a716-446655440001",
      basedOn: [
        {
          reference: "ServiceRequest/550e8400-e29b-41d4-a716-446655440000",
        },
      ],
      status: "final",
      code: {
        coding: [
          {
            system: "http://snomed.info/sct",
            code: "31676001",
            display: "HIV antigen test",
          },
        ],
        text: "HIV antigen test",
      },
      subject: {
        reference: "Patient/123e4567-e89b-12d3-a456-426614174000",
      },
      effectiveDateTime: "2025-11-04T15:45:00Z",
      issued: "2025-11-04T16:00:00Z",
      performer: [
        {
          reference: "Organization/SUPP001",
          display: "Test Supplier Ltd",
        },
      ],
      valueCodeableConcept: {
        coding: [
          {
            system: "http://snomed.info/sct",
            code: "260415000",
            display: "Not detected",
          },
        ],
      },
      interpretation: [
        {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
              code: "N",
              display: "Normal",
            },
          ],
          text: "Normal",
        },
      ],
    };

    mockBundle = {
      resourceType: "Bundle",
      type: "searchset",
      total: 1,
      entry: [
        {
          fullUrl: "urn:uuid:550e8400-e29b-41d4-a716-446655440001",
          resource: expectedObservation,
        },
      ],
    };

    mockGetResult.mockReset();
    mockGetResults.mockReset();
    mockGetCorrelationIdFromEventHeaders.mockReset();
    mockGetCorrelationIdFromEventHeaders.mockReturnValue(testCorrelationId);

    // Default mocks for successful flow
    mockGetResults.mockResolvedValue(mockBundle); // Results API response
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const getObservationFromResult = (result: APIGatewayProxyResult) => {
    return JSON.parse(result.body) as Observation;
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
      expect(observation).toEqual(expectedObservation);

      expect(mockGetResult).toHaveBeenCalledWith(
        "123e4567-e89b-12d3-a456-426614174000",
        "1234567890",
        new Date("1990-01-15"),
      );
      expect(mockGetResults).toHaveBeenCalledWith(
        "123e4567-e89b-12d3-a456-426614174000",
        "SUP001",
        testCorrelationId,
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

  describe("Correlation ID handling", () => {
    test("should throw error when correlation ID is missing or invalid", async () => {
      mockGetCorrelationIdFromEventHeaders.mockImplementation(() => {
        throw new Error(
          "Correlation ID is missing or invalid in the event headers. Expected a valid UUID in 'X-Correlation-ID' or 'x-correlation-id'.",
        );
      });

      await expect(lambdaHandler(mockEvent as APIGatewayProxyEvent)).rejects.toThrow(
        "Correlation ID is missing or invalid in the event headers",
      );
    });

    test("should use correlation ID from X-Correlation-ID header", async () => {
      const customCorrelationId = "custom-550e8400-e29b-41d4-a716-446655440099";
      mockGetCorrelationIdFromEventHeaders.mockReturnValue(customCorrelationId);
      mockGetResult.mockResolvedValue(mockTestResult);

      await lambdaHandler(mockEvent as APIGatewayProxyEvent);

      expect(mockGetResults).toHaveBeenCalledWith(
        "123e4567-e89b-12d3-a456-426614174000",
        "SUP001",
        customCorrelationId,
      );
    });

    test("should use correlation ID from x-correlation-id header (lowercase)", async () => {
      const customCorrelationId = "lowercase-550e8400-e29b-41d4-a716-446655440099";
      mockGetCorrelationIdFromEventHeaders.mockReturnValue(customCorrelationId);
      mockGetResult.mockResolvedValue(mockTestResult);

      mockEvent.headers = {
        "x-correlation-id": customCorrelationId,
      };

      await lambdaHandler(mockEvent as APIGatewayProxyEvent);

      expect(mockGetResults).toHaveBeenCalledWith(
        "123e4567-e89b-12d3-a456-426614174000",
        "SUP001",
        customCorrelationId,
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

    test("should return 404 when supplier API returns abnormal result", async () => {
      mockGetResult.mockResolvedValue(mockTestResult);

      // Setup mocks again with abnormal result
      const abnormalBundle = {
        ...mockBundle,
        entry: [
          {
            ...mockBundle.entry![0],
            resource: {
              ...mockBundle.entry![0].resource,
              interpretation: [
                {
                  coding: [
                    {
                      system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
                      code: "A", // Abnormal
                      display: "Abnormal",
                    },
                  ],
                  text: "Abnormal",
                },
              ],
            },
          },
        ],
      };

      mockGetResults.mockResolvedValueOnce(abnormalBundle);

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
