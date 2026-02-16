import { APIGatewayProxyEvent } from "aws-lambda";
import { Order } from "../lib/db/db-clients/order-db-client";
import { lambdaHandler } from "./index";

var mockOrderDbClient!: { getOrder: jest.Mock };

jest.mock("./init", () => {
  mockOrderDbClient = {
    getOrder: jest.fn(),
  };
  return {
    init: jest.fn(() => ({ orderDbClient: mockOrderDbClient })),
  };
});

const mockGetOrder = mockOrderDbClient.getOrder;

describe("Get Order Lambda Handler", () => {
  let mockEvent: Partial<APIGatewayProxyEvent>;
  let mockOrder: Order;

  beforeEach(() => {
    mockEvent = {
      httpMethod: "GET",
      path: "/order",
      queryStringParameters: {
        order_id: "123e4567-e89b-12d3-a456-426614174000",
        nhs_number: "1234567890",
        date_of_birth: "1990-01-15",
      },
      headers: {},
    };

    mockOrder = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      referenceNumber: 12345,
      createdAt: "2024-01-15T10:30:00Z",
      statusCode: "DISPATCHED",
      statusDescription: "Order dispatched",
      statusDate: "2024-01-16T08:00:00Z",
      supplierId: "SUP001",
      supplierName: "Test Supplier Ltd",
      nhsNumber: "1234567890",
      birthDate: new Date("1990-01-15"),
    };

    mockGetOrder.mockReset();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Success scenarios", () => {
    test("should return order bundle when valid query parameters are provided", async () => {
      mockGetOrder.mockResolvedValue(mockOrder);

      const result = await lambdaHandler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(200);
      expect(result.headers).toEqual({
        "Content-Type": "application/fhir+json",
      });

      const responseBody = JSON.parse(result.body);
      expect(responseBody.resourceType).toBe("Bundle");
      expect(responseBody.type).toBe("searchset");
      expect(responseBody.total).toBe(1);
      expect(responseBody.entry).toHaveLength(1);
      expect(responseBody.entry[0].fullUrl).toBe(`urn:uuid:${mockOrder.id}`);

      expect(mockGetOrder).toHaveBeenCalledWith(
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

      mockGetOrder.mockResolvedValue(mockOrder);

      const result = await lambdaHandler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(200);
      expect(mockGetOrder).toHaveBeenCalledWith(
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

      mockGetOrder.mockResolvedValue(mockOrder);

      const result = await lambdaHandler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(200);
      expect(mockGetOrder).toHaveBeenCalledWith(
        "123e4567-e89b-12d3-a456-426614174000",
        "1234567890",
        new Date("1990-01-15"),
      );
    });

    test("should return bundle with completed status when order status is COMPLETE", async () => {
      mockOrder.statusCode = "COMPLETE";
      mockGetOrder.mockResolvedValue(mockOrder);

      const result = await lambdaHandler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(200);

      const responseBody = JSON.parse(result.body);
      const serviceRequest = responseBody.entry[0].resource;
      expect(serviceRequest.status).toBe("completed");
    });

    test("should return bundle with active status when order status is not COMPLETE", async () => {
      mockOrder.statusCode = "DISPATCHED";
      mockGetOrder.mockResolvedValue(mockOrder);

      const result = await lambdaHandler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(200);

      const responseBody = JSON.parse(result.body);
      const serviceRequest = responseBody.entry[0].resource;
      expect(serviceRequest.status).toBe("active");
    });
  });

  describe("Not found scenarios", () => {
    test("should return 404 when order does not exist", async () => {
      mockGetOrder.mockResolvedValue(null);

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
      expect(responseBody.issue[0].diagnostics).toContain(
        "Invalid order id format",
      );
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
      expect(responseBody.issue[0].diagnostics).toContain("order_id");
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
      expect(responseBody.issue[0]).toMatchObject({
        severity: "error",
        code: "invalid",
      });
      expect(responseBody.issue[0].diagnostics).toContain("nhs_number");
    });

    test("should return 400 when nhs_number has less than 10 digits", async () => {
      mockEvent.queryStringParameters = {
        order_id: "123e4567-e89b-12d3-a456-426614174000",
        nhs_number: "123456789",
        date_of_birth: "1990-01-15",
      };

      const result = await lambdaHandler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);

      const responseBody = JSON.parse(result.body);
      expect(responseBody.issue[0].diagnostics).toContain("nhs_number");
      expect(responseBody.issue[0].diagnostics).toContain("10 digits");
    });

    test("should return 400 when nhs_number has more than 10 digits", async () => {
      mockEvent.queryStringParameters = {
        order_id: "123e4567-e89b-12d3-a456-426614174000",
        nhs_number: "12345678901",
        date_of_birth: "1990-01-15",
      };

      const result = await lambdaHandler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);

      const responseBody = JSON.parse(result.body);
      expect(responseBody.issue[0].diagnostics).toContain("nhs_number");
      expect(responseBody.issue[0].diagnostics).toContain("10 digits");
    });

    test("should return 400 when nhs_number contains non-numeric characters", async () => {
      mockEvent.queryStringParameters = {
        order_id: "123e4567-e89b-12d3-a456-426614174000",
        nhs_number: "123456789A",
        date_of_birth: "1990-01-15",
      };

      const result = await lambdaHandler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);

      const responseBody = JSON.parse(result.body);
      expect(responseBody.issue[0].diagnostics).toContain("nhs_number");
      expect(responseBody.issue[0].diagnostics).toContain("10 digits");
    });

    test("should return 400 when nhs_number is empty string", async () => {
      mockEvent.queryStringParameters = {
        order_id: "123e4567-e89b-12d3-a456-426614174000",
        nhs_number: "",
        date_of_birth: "1990-01-15",
      };

      const result = await lambdaHandler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);

      const responseBody = JSON.parse(result.body);
      expect(responseBody.issue[0].diagnostics).toContain("nhs_number");
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
      expect(responseBody.issue[0].diagnostics).toContain("date_of_birth");
      expect(responseBody.issue[0].diagnostics).toContain("yyyy-mm-dd");
    });

    test("should return 400 when date_of_birth is not a valid date", async () => {
      mockEvent.queryStringParameters = {
        order_id: "123e4567-e89b-12d3-a456-426614174000",
        nhs_number: "1234567890",
        date_of_birth: "1990-13-45",
      };

      const result = await lambdaHandler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);

      const responseBody = JSON.parse(result.body);
      expect(responseBody.issue[0].diagnostics).toContain("date_of_birth");
      expect(responseBody.issue[0].diagnostics).toContain("valid date");
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
      expect(responseBody.issue[0].diagnostics).toContain("date_of_birth");
    });
  });

  describe("Validation scenarios - multiple parameters", () => {
    test("should return 400 with all validation errors when multiple parameters are invalid", async () => {
      mockEvent.queryStringParameters = {
        order_id: "invalid-uuid",
        nhs_number: "123",
        date_of_birth: "invalid-date",
      };

      const result = await lambdaHandler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);

      const responseBody = JSON.parse(result.body);
      expect(responseBody.issue[0].diagnostics).toContain("order_id");
      expect(responseBody.issue[0].diagnostics).toContain("nhs_number");
      expect(responseBody.issue[0].diagnostics).toContain("date_of_birth");
    });

    test("should return 400 when queryStringParameters is null", async () => {
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

    test("should return 400 when queryStringParameters is undefined", async () => {
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

  describe("Bundle structure validation", () => {
    test("should return correctly structured FHIR Bundle", async () => {
      mockGetOrder.mockResolvedValue(mockOrder);

      const result = await lambdaHandler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(200);

      const bundle = JSON.parse(result.body);

      expect(bundle).toMatchObject({
        resourceType: "Bundle",
        type: "searchset",
        total: 1,
      });
      expect(bundle.entry).toHaveLength(1);
    });

    test("should include ServiceRequest with correct identifier", async () => {
      mockGetOrder.mockResolvedValue(mockOrder);

      const result = await lambdaHandler(mockEvent as APIGatewayProxyEvent);

      const bundle = JSON.parse(result.body);
      const serviceRequest = bundle.entry[0].resource;

      expect(serviceRequest.resourceType).toBe("ServiceRequest");
      expect(serviceRequest.identifier).toContainEqual({
        system: "https://fhir.hometest.nhs.uk/Id/order-id",
        value: "12345",
      });
    });

    test("should include ServiceRequest with correct performer information", async () => {
      mockGetOrder.mockResolvedValue(mockOrder);

      const result = await lambdaHandler(mockEvent as APIGatewayProxyEvent);

      const bundle = JSON.parse(result.body);
      const serviceRequest = bundle.entry[0].resource;

      expect(serviceRequest.performer).toHaveLength(1);
      expect(serviceRequest.performer[0]).toEqual({
        reference: "Organization/SUP001",
        type: "Organization",
        display: "Test Supplier Ltd",
      });
    });

    test("should include ServiceRequest with business status extension", async () => {
      mockGetOrder.mockResolvedValue(mockOrder);

      const result = await lambdaHandler(mockEvent as APIGatewayProxyEvent);

      const bundle = JSON.parse(result.body);
      const serviceRequest = bundle.entry[0].resource;

      const businessStatusExtension = serviceRequest.extension.find(
        (ext: any) =>
          ext.url ===
          "https://fhir.hometest.nhs.uk/StructureDefinition/business-status",
      );

      expect(businessStatusExtension).toBeDefined();
      expect(
        businessStatusExtension.valueCodeableConcept.coding[0],
      ).toMatchObject({
        system: "https://fhir.hometest.nhs.uk/CodeSystem/order-business-status",
        code: "DISPATCHED",
        display: "Order dispatched",
      });
    });

    test("should include contained Patient resource with NHS number", async () => {
      mockGetOrder.mockResolvedValue(mockOrder);

      const result = await lambdaHandler(mockEvent as APIGatewayProxyEvent);

      const bundle = JSON.parse(result.body);
      const serviceRequest = bundle.entry[0].resource;

      expect(serviceRequest.contained).toHaveLength(1);
      const patient = serviceRequest.contained[0];

      expect(patient.resourceType).toBe("Patient");
      expect(patient.identifier).toContainEqual({
        system: "https://fhir.nhs.uk/Id/nhs-number",
        value: "1234567890",
        use: "official",
      });
      expect(patient.birthDate).toBe("1990-01-15");
    });

    test("should include ServiceRequest with HIV antigen test code", async () => {
      mockGetOrder.mockResolvedValue(mockOrder);

      const result = await lambdaHandler(mockEvent as APIGatewayProxyEvent);

      const bundle = JSON.parse(result.body);
      const serviceRequest = bundle.entry[0].resource;

      expect(serviceRequest.code).toEqual({
        coding: [
          {
            system: "http://snomed.info/sct",
            code: "31676001",
            display: "HIV antigen test",
          },
        ],
        text: "HIV antigen test",
      });
    });
  });
});
