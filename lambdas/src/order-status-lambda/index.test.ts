import { APIGatewayProxyEvent, Context } from "aws-lambda";

const mockGetOrder = jest.fn();
const mockGetLatestOrderStatus = jest.fn();
const mockCheckIdempotency = jest.fn();
const mockUpdateOrderStatus = jest.fn();
const mockExtractIdFromReference = jest.fn();
const mockIsValidBusinessStatus = jest.fn();

jest.mock("../lib/db/order-status-db", () => ({
  OrderStatusService: jest.fn().mockImplementation(() => ({
    getOrder: mockGetOrder,
    getLatestOrderStatus: mockGetLatestOrderStatus,
    checkIdempotency: mockCheckIdempotency,
    updateOrderStatus: mockUpdateOrderStatus,
    extractIdFromReference: mockExtractIdFromReference,
    isValidBusinessStatus: mockIsValidBusinessStatus,
  })),
}));

jest.mock("../lib/db/db-client", () => ({
  PostgresDbClient: jest.fn(),
}));

process.env.DATABASE_URL = "postgres://localhost/test";

import { handler } from "./index";
import { FHIRTask } from "src/lib/models/fhir/fhir-service-request-type";
import { OrderRow, OrderStatusRow } from "src/lib/db/order-status-db";

describe("Order Status Lambda Handler", () => {
  let mockEvent: Partial<APIGatewayProxyEvent>;
  let _mockContext: Partial<Context>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockEvent = {
      httpMethod: "PUT",
      path: "/test-order/status",
      body: null,
      headers: {},
    };
    _mockContext = {};

    // Default mock values
    mockExtractIdFromReference.mockImplementation((reference: string) => {
      if (reference.startsWith("Patient/")) return "patient-123";
      if (reference.startsWith("ServiceRequest/"))
        return "550e8400-e29b-41d4-a716-446655440000";

      return null;
    });

    mockGetOrder.mockResolvedValue({
      order_uid: "550e8400-e29b-41d4-a716-446655440000",
      patient_uid: "patient-123",
      order_reference: 100001,
      supplier_id: "supplier-123",
      test_code: "TEST001",
      created_at: "2024-01-01T00:00:00Z",
    } satisfies OrderRow);

    mockGetLatestOrderStatus.mockResolvedValue(null);
    mockCheckIdempotency.mockResolvedValue({ isDuplicate: false });
    mockIsValidBusinessStatus.mockReturnValue(true);
    mockUpdateOrderStatus.mockResolvedValue({
      order_uid: "550e8400-e29b-41d4-a716-446655440000",
      status_code: "completed",
      created_at: "2024-01-15T10:00:00Z",
    } satisfies Partial<OrderStatusRow>);
  });

  const validTaskBody: FHIRTask = {
    resourceType: "Task",
    status: "COMPLETE",
    intent: "order",
    basedOn: [
      {
        reference: "ServiceRequest/550e8400-e29b-41d4-a716-446655440000",
      },
    ],
    for: {
      reference: "Patient/patient-123",
    },
    authoredOn: "2024-01-15T10:00:00Z",
    businessStatus: {
      text: "DISPATCHED",
    },
  };

  describe("Request Parsing and Validation", () => {
    it("should return 400 if request body is empty", async () => {
      mockEvent.body = "";

      const result = await handler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);
      expect(result.headers?.["Content-Type"]).toBe("application/fhir+json");

      const body = JSON.parse(result.body);

      expect(body.resourceType).toBe("OperationOutcome");
      expect(body.issue[0].code).toBe("invalid");
    });

    it("should return 400 if request body is invalid JSON", async () => {
      mockEvent.body = "{invalid json";

      const result = await handler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);

      const body = JSON.parse(result.body);

      expect(body.resourceType).toBe("OperationOutcome");
    });

    it("should return 400 if Task schema validation fails", async () => {
      mockEvent.body = JSON.stringify({
        resourceType: "Task",
        status: "completed",
        // Missing required basedOn field
        for: {
          reference: "Patient/patient-123",
        },
      });

      const result = await handler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);

      const body = JSON.parse(result.body);

      expect(body.resourceType).toBe("OperationOutcome");
      expect(body.issue[0].code).toBe("invalid");
    });

    it("should return 400 if basedOn reference format is invalid", async () => {
      mockExtractIdFromReference.mockReturnValueOnce(null);

      mockEvent.body = JSON.stringify({
        ...validTaskBody,
        basedOn: [{ reference: "invalid-reference" }],
      } satisfies Partial<FHIRTask>);

      const result = await handler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);

      const body = JSON.parse(result.body);

      expect(body.issue[0].diagnostics).toContain("Invalid order reference");
    });
  });

  describe("Order Existence", () => {
    it("should return 404 when order does not exist", async () => {
      mockGetOrder.mockResolvedValueOnce(null);
      mockEvent.body = JSON.stringify(validTaskBody);

      const result = await handler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(404);

      const body = JSON.parse(result.body);

      expect(body.resourceType).toBe("OperationOutcome");
      expect(body.issue[0].code).toBe("not-found");
      expect(body.issue[0].diagnostics).toContain("not found");
    });

    it("should proceed when order exists", async () => {
      mockEvent.body = JSON.stringify(validTaskBody);

      const result = await handler(mockEvent as APIGatewayProxyEvent);

      expect(mockGetOrder).toHaveBeenCalledWith(
        "550e8400-e29b-41d4-a716-446655440000",
      );
      expect(result.statusCode).toBe(200);
    });
  });

  describe("Patient Ownership", () => {
    it("should return 400 when patient reference format is invalid", async () => {
      mockExtractIdFromReference.mockImplementation((reference: string) => {
        if (reference.startsWith("Patient/")) return null;
        if (reference.startsWith("ServiceRequest/"))
          return "550e8400-e29b-41d4-a716-446655440000";

        return null;
      });

      mockEvent.body = JSON.stringify({
        ...validTaskBody,
        for: { reference: "invalid-ref" },
      } satisfies Partial<FHIRTask>);

      const result = await handler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);

      const body = JSON.parse(result.body);

      expect(body.issue[0].diagnostics).toContain("Invalid patient reference");
    });

    it("should return 400 when patient does not match order", async () => {
      mockExtractIdFromReference.mockImplementation((reference: string) => {
        if (reference.startsWith("Patient/")) return "different-patient";
        if (reference.startsWith("ServiceRequest/"))
          return "550e8400-e29b-41d4-a716-446655440000";

        return null;
      });
      mockEvent.body = JSON.stringify(validTaskBody);

      const result = await handler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);

      const body = JSON.parse(result.body);

      expect(body.resourceType).toBe("OperationOutcome");
      expect(body.issue[0].diagnostics).toContain("Patient ID does not match");
    });

    it("should proceed when patient matches order", async () => {
      mockEvent.body = JSON.stringify(validTaskBody);

      const result = await handler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(200);
    });
  });

  describe("Business Status Validation", () => {
    it("should return 400 for invalid business status", async () => {
      mockIsValidBusinessStatus.mockReturnValueOnce(false);

      mockEvent.body = JSON.stringify({
        ...validTaskBody,
        businessStatus: { text: "INVALID_STATUS" },
      } satisfies Partial<FHIRTask>);

      const result = await handler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);

      const body = JSON.parse(result.body);

      expect(body.issue[0].diagnostics).toContain("Invalid business status");
      expect(body.issue[0].diagnostics).toContain("DISPATCHED");
      expect(body.issue[0].diagnostics).toContain("RECEIVED");
    });

    it("should accept DISPATCHED business status", async () => {
      mockEvent.body = JSON.stringify({
        ...validTaskBody,
        businessStatus: { text: "DISPATCHED" },
      } satisfies Partial<FHIRTask>);

      const result = await handler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(200);
      expect(mockIsValidBusinessStatus).toHaveBeenCalledWith("DISPATCHED");
    });

    it("should accept RECEIVED business status", async () => {
      mockEvent.body = JSON.stringify({
        ...validTaskBody,
        businessStatus: { text: "RECEIVED" },
      } satisfies Partial<FHIRTask>);

      const result = await handler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(200);
      expect(mockIsValidBusinessStatus).toHaveBeenCalledWith("RECEIVED");
    });

    it("should allow missing business status", async () => {
      mockEvent.body = JSON.stringify({
        ...validTaskBody,
        businessStatus: undefined,
      } satisfies Partial<FHIRTask>);

      const result = await handler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(200);
    });

    it("should accept businessStatus.coding[0].code format", async () => {
      mockIsValidBusinessStatus.mockReturnValueOnce(true);
      mockEvent.body = JSON.stringify({
        ...validTaskBody,
        businessStatus: {
          coding: [{ code: "DISPATCHED" }],
        },
      } satisfies Partial<FHIRTask>);

      const result = await handler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(200);
      expect(mockIsValidBusinessStatus).toHaveBeenCalledWith("DISPATCHED");
    });
  });

  describe("Idempotency via Correlation ID", () => {
    it("should detect duplicate updates with same correlation ID", async () => {
      const correlationId = "12345678-1234-1234-1234-123456789012";
      mockEvent.headers = { "X-Correlation-ID": correlationId };
      mockCheckIdempotency.mockResolvedValueOnce({
        isDuplicate: true,
        lastUpdate: {
          order_uid: "550e8400-e29b-41d4-a716-446655440000",
          status_code: "completed",
          timestamp: "2024-01-15T09:00:00Z",
        },
      });

      mockEvent.body = JSON.stringify(validTaskBody);

      const result = await handler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(200);
      expect(mockCheckIdempotency).toHaveBeenCalledWith(
        "550e8400-e29b-41d4-a716-446655440000",
        correlationId,
      );
    });

    it("should process new updates with different correlation ID", async () => {
      const correlationId = "12345678-1234-1234-1234-123456789012";

      mockEvent.headers = { "X-Correlation-ID": correlationId };
      mockCheckIdempotency.mockResolvedValueOnce({ isDuplicate: false });

      mockEvent.body = JSON.stringify(validTaskBody);
      const result = await handler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(200);
      expect(mockUpdateOrderStatus).toHaveBeenCalled();
    });

    it("should handle missing correlation ID gracefully", async () => {
      mockEvent.headers = {};
      mockCheckIdempotency.mockResolvedValueOnce({ isDuplicate: false });

      mockEvent.body = JSON.stringify(validTaskBody);
      const result = await handler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(200);
    });
  });

  describe("Timestamp Handling", () => {
    it("should accept when lastModified timestamp is older than latest update", async () => {
      mockGetLatestOrderStatus.mockResolvedValueOnce({
        order_uid: "550e8400-e29b-41d4-a716-446655440000",
        status_code: "in-progress",
        created_at: "2024-01-15T09:00:00Z",
      });

      mockEvent.body = JSON.stringify({
        ...validTaskBody,
        lastModified: "2024-01-15T08:00:00Z", // Older than latest
      } satisfies Partial<FHIRTask>);

      const result = await handler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(200);

      expect(mockUpdateOrderStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          createdAt: "2024-01-15T08:00:00Z",
        }),
      );
    });

    it("should accept when lastModified timestamp is newer than latest update", async () => {
      mockGetLatestOrderStatus.mockResolvedValueOnce({
        order_uid: "550e8400-e29b-41d4-a716-446655440000",
        status_code: "in-progress",
        created_at: "2024-01-15T09:00:00Z",
      });

      mockEvent.body = JSON.stringify({
        ...validTaskBody,
        lastModified: "2024-01-15T11:00:00Z", // Newer than latest
      } satisfies Partial<FHIRTask>);

      const result = await handler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(200);

      expect(mockUpdateOrderStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          createdAt: "2024-01-15T11:00:00Z",
        }),
      );
    });

    it("should accept authoredOn timestamp instead of lastModified", async () => {
      mockEvent.body = JSON.stringify({
        ...validTaskBody,
        authoredOn: "2024-01-15T12:00:00Z",
        lastModified: undefined,
      } satisfies Partial<FHIRTask>);

      const result = await handler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(200);

      expect(mockUpdateOrderStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          createdAt: "2024-01-15T12:00:00Z",
        }),
      );
    });

    it("should reject when both authoredOn and lastModified are missing", async () => {
      mockEvent.body = JSON.stringify({
        resourceType: "Task",
        status: "COMPLETE",
        intent: "order",
        basedOn: [
          {
            reference: "ServiceRequest/550e8400-e29b-41d4-a716-446655440000",
          },
        ],
        for: {
          reference: "Patient/patient-123",
        },
      } satisfies Partial<FHIRTask>);

      const result = await handler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);

      const body = JSON.parse(result.body);

      expect(body.issue[0].diagnostics).toContain("timestamp");
    });

    it("should accept update when no previous status exists", async () => {
      mockGetLatestOrderStatus.mockResolvedValueOnce(null);

      mockEvent.body = JSON.stringify(validTaskBody);

      const result = await handler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(200);
    });
  });

  describe("Successful Update", () => {
    it("should return 200 OK with updated Task when all validations pass", async () => {
      mockEvent.body = JSON.stringify(validTaskBody);
      const result = await handler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(200);
      expect(result.headers?.["Content-Type"]).toBe("application/fhir+json");
      const body = JSON.parse(result.body);
      expect(body.resourceType).toBe("Task");
      expect(body.status).toBe("COMPLETE");
      expect(body.for.reference).toBe("Patient/patient-123");
    });

    it("should call updateOrderStatus with correct parameters", async () => {
      const correlationId = "corr-123";
      mockEvent.headers = { "X-Correlation-ID": correlationId };
      mockEvent.body = JSON.stringify(validTaskBody);

      await handler(mockEvent as APIGatewayProxyEvent);

      expect(mockUpdateOrderStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: "550e8400-e29b-41d4-a716-446655440000",
          statusCode: "COMPLETE",
          businessStatus: "DISPATCHED",
          createdAt: "2024-01-15T10:00:00Z",
          correlationId,
        }),
      );
    });
  });

  describe("Error Handling", () => {
    it("should return OperationOutcome for validation errors", async () => {
      mockEvent.body = JSON.stringify({
        resourceType: "Task",
        // Invalid - missing required fields
      } satisfies Partial<FHIRTask>);

      const result = await handler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.resourceType).toBe("OperationOutcome");
      expect(body.issue[0].severity).toBe("error");
    });

    it("should return 500 with OperationOutcome for database errors", async () => {
      mockGetOrder.mockRejectedValueOnce(
        new Error("Database connection failed"),
      );
      mockEvent.body = JSON.stringify(validTaskBody);

      const result = await handler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(500);

      const body = JSON.parse(result.body);

      expect(body.resourceType).toBe("OperationOutcome");
      expect(body.issue[0].severity).toBe("fatal");
      expect(body.issue[0].code).toBe("exception");
    });

    it("should return 500 with OperationOutcome for unexpected errors", async () => {
      mockCheckIdempotency.mockRejectedValueOnce(new Error("Unexpected error"));

      mockEvent.body = JSON.stringify(validTaskBody);

      const result = await handler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(500);

      const body = JSON.parse(result.body);

      expect(body.resourceType).toBe("OperationOutcome");
      expect(body.issue[0].severity).toBe("fatal");
    });
  });
});
