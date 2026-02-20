import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { handler } from "./index";
import { FHIRTask } from "src/lib/models/fhir/fhir-service-request-type";
import {
  IdempotencyCheckResult,
  OrderRow,
  OrderStatusRow,
} from "src/lib/db/order-status-db";

const mockGetCorrelationIdFromEventHeaders = jest.fn();

const mockGetOrder = jest.fn();
const mockCheckIdempotency = jest.fn();
const mockUpdateOrderStatus = jest.fn();

jest.mock("../lib/utils", () => ({
  ...jest.requireActual("../lib/utils"),
  getCorrelationIdFromEventHeaders: () =>
    mockGetCorrelationIdFromEventHeaders(),
}));

jest.mock("../lib/db/order-status-db", () => ({
  OrderStatusService: jest.fn().mockImplementation(() => ({
    getOrder: mockGetOrder,
    checkIdempotency: mockCheckIdempotency,
    updateOrderStatus: mockUpdateOrderStatus,
  })),
}));

jest.mock("../lib/db/db-client", () => ({
  PostgresDbClient: jest.fn(),
}));

process.env.DATABASE_URL = "postgres://localhost/test";

const MOCK_CORRELATION_ID = "123e4567-e89b-12d3-a456-426614174000";
const MOCK_ORDER_UID = "550e8400-e29b-41d4-a716-446655440000";
const MOCK_PATIENT_UID = "patient-123";

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
    mockGetCorrelationIdFromEventHeaders.mockReturnValue(MOCK_CORRELATION_ID);

    mockGetOrder.mockResolvedValue({
      order_uid: MOCK_ORDER_UID,
      patient_uid: MOCK_PATIENT_UID,
      order_reference: 100001,
      supplier_id: "supplier-123",
      test_code: "TEST001",
      created_at: "2024-01-01T00:00:00Z",
    } satisfies OrderRow);

    mockCheckIdempotency.mockResolvedValue({ isDuplicate: false });
    mockUpdateOrderStatus.mockResolvedValue({
      order_uid: MOCK_ORDER_UID,
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
        reference: `ServiceRequest/${MOCK_ORDER_UID}`,
      },
    ],
    for: {
      reference: `Patient/${MOCK_PATIENT_UID}`,
    },
    authoredOn: "2024-01-15T09:00:00Z",
    lastModified: "2024-01-15T10:00:00Z",
    businessStatus: {
      text: "DISPATCHED",
    },
  };

  describe("Request Parsing and Validation", () => {
    it("should return 400 if request body is empty", async () => {
      mockEvent.body = "{}";

      const result = await handler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);
      expect(result.headers?.["Content-Type"]).toBe("application/fhir+json");

      const body = JSON.parse(result.body);

      expect(body.resourceType).toBe("OperationOutcome");
      expect(body.issue[0].code).toBe("invalid");
    });

    it("should return 400 if request body is null", async () => {
      mockEvent.body = null;

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
        status: "COMPLETE",
        for: {
          reference: `Patient/${MOCK_PATIENT_UID}`,
        },
      } satisfies Partial<Omit<FHIRTask, "basedOn">>);

      const result = await handler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);

      const body = JSON.parse(result.body);

      expect(body.resourceType).toBe("OperationOutcome");
      expect(body.issue[0].code).toBe("invalid");
    });

    it("should return 400 if basedOn reference format is invalid", async () => {
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

      expect(mockGetOrder).toHaveBeenCalledWith(MOCK_ORDER_UID);
      expect(result.statusCode).toBe(200);
    });
  });

  describe("Patient Ownership", () => {
    it("should return 400 when patient reference format is invalid", async () => {
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
      mockEvent.body = JSON.stringify({
        ...validTaskBody,
        for: { reference: "Patient/other-patient" },
      } satisfies Partial<FHIRTask>);

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
    });

    it("should accept RECEIVED business status", async () => {
      mockEvent.body = JSON.stringify({
        ...validTaskBody,
        businessStatus: { text: "RECEIVED" },
      } satisfies Partial<FHIRTask>);

      const result = await handler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(200);
    });

    it("should allow missing business status", async () => {
      mockEvent.body = JSON.stringify({
        ...validTaskBody,
        businessStatus: undefined,
      } satisfies Partial<FHIRTask>);

      const result = await handler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(200);
    });
  });

  describe("Idempotency via Correlation ID", () => {
    it("should detect duplicate updates with same correlation ID", async () => {
      mockCheckIdempotency.mockResolvedValueOnce({
        isDuplicate: true,
        lastUpdate: {
          order_uid: MOCK_ORDER_UID,
          status_code: "",
          created_at: "",
          status_id: "",
          order_reference: 0,
          correlation_id: "",
        },
      } satisfies Partial<IdempotencyCheckResult>);

      mockEvent.body = JSON.stringify(validTaskBody);

      const result = await handler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(200);
      expect(mockCheckIdempotency).toHaveBeenCalledWith(
        MOCK_ORDER_UID,
        MOCK_CORRELATION_ID,
      );
    });

    it("should process new updates with different correlation ID", async () => {
      const newCorrelationId = "123e4567-e89b-12d3-a456-426614174999";
      mockGetCorrelationIdFromEventHeaders.mockReturnValueOnce(
        newCorrelationId,
      );

      mockCheckIdempotency.mockResolvedValueOnce({
        isDuplicate: false,
      } satisfies IdempotencyCheckResult);

      mockEvent.body = JSON.stringify(validTaskBody);
      const result = await handler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(200);

      expect(mockUpdateOrderStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          correlationId: newCorrelationId,
        }),
      );
    });

    it("should return 400 when there is no correlation id", async () => {
      mockEvent.headers = {};

      mockGetCorrelationIdFromEventHeaders.mockImplementation(() => {
        throw new Error("Correlation ID is missing or invalid");
      });

      mockEvent.body = JSON.stringify(validTaskBody);
      const result = await handler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);

      const body = JSON.parse(result.body);

      expect(body.issue[0].diagnostics).toMatch(/correlation id/i);
    });
  });

  describe("Timestamp Handling", () => {
    it("should accept when lastModified timestamp is older than latest update", async () => {
      const mockedLastModifiedTimestamp = "2024-01-15T08:00:00Z";

      mockEvent.body = JSON.stringify({
        ...validTaskBody,
        lastModified: mockedLastModifiedTimestamp, // Older than latest
      } satisfies Partial<FHIRTask>);

      const result = await handler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(200);

      expect(mockUpdateOrderStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          createdAt: mockedLastModifiedTimestamp,
        }),
      );
    });

    it("should accept when lastModified timestamp is newer than latest update", async () => {
      const mockedLastModifiedTimestamp = "2024-01-15T11:00:00Z";

      mockEvent.body = JSON.stringify({
        ...validTaskBody,
        lastModified: mockedLastModifiedTimestamp, // Newer than latest
      } satisfies Partial<FHIRTask>);

      const result = await handler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(200);

      expect(mockUpdateOrderStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          createdAt: mockedLastModifiedTimestamp,
        }),
      );
    });

    it("should accept authoredOn timestamp instead of lastModified", async () => {
      mockEvent.body = JSON.stringify({
        ...validTaskBody,
        lastModified: undefined,
      } satisfies Partial<FHIRTask>);

      const result = await handler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(200);

      expect(mockUpdateOrderStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          createdAt: validTaskBody.authoredOn,
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
            reference: `ServiceRequest/${MOCK_ORDER_UID}`,
          },
        ],
        for: {
          reference: `Patient/${MOCK_PATIENT_UID}`,
        },
      } satisfies Partial<FHIRTask>);

      const result = await handler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);

      const body = JSON.parse(result.body);

      expect(body.issue[0].diagnostics).toContain("timestamp");
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
      expect(body.for.reference).toBe(`Patient/${MOCK_PATIENT_UID}`);
    });

    it("should call updateOrderStatus with correct parameters", async () => {
      mockEvent.body = JSON.stringify(validTaskBody);

      await handler(mockEvent as APIGatewayProxyEvent);

      expect(mockUpdateOrderStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: MOCK_ORDER_UID,
          statusCode: "COMPLETE",
          createdAt: validTaskBody.lastModified,
          correlationId: MOCK_CORRELATION_ID,
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
