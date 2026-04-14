import { APIGatewayProxyEvent } from "aws-lambda";

import { createFhirErrorResponse, createFhirResponse } from "../lib/fhir-response";
import { OrderStatus, ResultStatus } from "../lib/types/status";
import { lambdaHandler } from "./index";

const mockGetPatientIdFromOrder = jest.fn();
const mockUpdateOrderStatusAndResultStatus = jest.fn();

jest.mock("./init", () => ({
  init: jest.fn(() => ({
    orderStatusService: {
      getPatientIdFromOrder: mockGetPatientIdFromOrder,
    },
    orderService: {
      updateOrderStatusAndResultStatus: mockUpdateOrderStatusAndResultStatus,
    },
  })),
}));

jest.mock("../lib/fhir-response", () => ({
  createFhirErrorResponse: jest.fn((code, type, message, severity) => ({
    statusCode: code,
    body: JSON.stringify({ issue: [{ code: type, diagnostics: message, severity }] }),
  })),
  createFhirResponse: jest.fn((code, resource) => ({
    statusCode: code,
    body: JSON.stringify(resource),
  })),
}));

const VALID_ORDER_UUID = "123a1234-a12b-1234-abcd-1234567890ab";
const VALID_PATIENT_UUID = "123a1234-a12b-1234-abcd-1234567890ab";
const VALID_CORRELATION_ID = "123a1234-a12b-1234-abcd-1234567890ab";
const VALID_HEADERS = { "X-Correlation-ID": VALID_CORRELATION_ID };

const validTask = {
  resourceType: "Task",
  status: "completed",
  intent: "order",
  identifier: [{ value: VALID_ORDER_UUID }],
  for: { reference: `Patient/${VALID_PATIENT_UUID}` },
  businessStatus: { coding: [{ code: "result-available" }] },
  basedOn: [{ reference: "ServiceRequest/some-ref" }],
};

const makeEvent = (
  body: string | null,
  headers: Record<string, string> = {},
): APIGatewayProxyEvent =>
  ({
    body,
    headers,
  }) as APIGatewayProxyEvent;

const validEventHeaders = { "X-Correlation-ID": VALID_CORRELATION_ID };

describe("result-status-lambda handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockGetPatientIdFromOrder.mockReset();
    mockUpdateOrderStatusAndResultStatus.mockReset();

    mockUpdateOrderStatusAndResultStatus.mockResolvedValue({
      order_uid: VALID_ORDER_UUID,
      patient_uid: VALID_PATIENT_UUID,
    });
    mockGetPatientIdFromOrder.mockResolvedValue(undefined);
  });

  describe("request body parsing", () => {
    it("returns 400 when body is null", async () => {
      const res = await lambdaHandler(makeEvent(null, VALID_HEADERS));

      expect(res.statusCode).toBe(400);
      expect(createFhirErrorResponse).toHaveBeenCalledWith(
        400,
        "invalid",
        "Request body is required",
        "error",
      );
    });

    it("returns 400 when body is invalid JSON", async () => {
      const res = await lambdaHandler(makeEvent("not-valid-json", VALID_HEADERS));

      expect(res.statusCode).toBe(400);
      expect(createFhirErrorResponse).toHaveBeenCalledWith(
        400,
        "invalid",
        "Invalid JSON in request body",
        "error",
      );
    });

    it("returns 400 when correlation ID header is missing", async () => {
      const res = await lambdaHandler(makeEvent(JSON.stringify(validTask), {}));

      expect(res.statusCode).toBe(400);
      expect(createFhirErrorResponse).toHaveBeenCalledWith(
        400,
        "invalid",
        "Invalid correlation ID in headers",
        "error",
      );
    });

    it("returns 400 when task fails schema validation", async () => {
      const res = await lambdaHandler(
        makeEvent(JSON.stringify({ resourceType: "Task" }), VALID_HEADERS),
      );

      expect(res.statusCode).toBe(400);
      expect(createFhirErrorResponse).toHaveBeenCalledWith(
        400,
        "invalid",
        expect.stringContaining("Task validation failed"),
        "error",
      );
    });

    it("returns 400 when resourceType is not Task", async () => {
      const invalidTask = { ...validTask, resourceType: "Observation" };

      const res = await lambdaHandler(makeEvent(JSON.stringify(invalidTask), VALID_HEADERS));

      expect(res.statusCode).toBe(400);
    });

    it("returns 400 when businessStatus coding code is not result-available", async () => {
      const invalidTask = {
        ...validTask,
        businessStatus: { coding: [{ code: ResultStatus.Result_Withheld }] },
      };

      const res = await lambdaHandler(makeEvent(JSON.stringify(invalidTask), VALID_HEADERS));

      expect(res.statusCode).toBe(400);
    });

    it("returns 400 when identifier array is empty", async () => {
      const invalidTask = { ...validTask, identifier: [] };

      const res = await lambdaHandler(makeEvent(JSON.stringify(invalidTask), VALID_HEADERS));

      expect(res.statusCode).toBe(400);
    });
  });

  describe("FHIR Task identifier extraction", () => {
    it("returns 400 when for.reference has no slash (single segment)", async () => {
      const invalidTask = { ...validTask, for: { reference: VALID_PATIENT_UUID } };

      const res = await lambdaHandler(makeEvent(JSON.stringify(invalidTask), VALID_HEADERS));

      expect(res.statusCode).toBe(400);
      expect(createFhirErrorResponse).toHaveBeenCalledWith(
        400,
        "invalid",
        "Invalid for.reference format",
        "error",
      );
    });

    it("returns 400 when for.reference has more than two segments", async () => {
      const invalidTask = {
        ...validTask,
        for: { reference: `Patient/${VALID_PATIENT_UUID}/extra` },
      };

      const res = await lambdaHandler(makeEvent(JSON.stringify(invalidTask), VALID_HEADERS));

      expect(res.statusCode).toBe(400);
      expect(createFhirErrorResponse).toHaveBeenCalledWith(
        400,
        "invalid",
        "Invalid for.reference format",
        "error",
      );
    });

    it("returns 400 when patient ID in for.reference is not a valid UUID", async () => {
      const invalidTask = { ...validTask, for: { reference: "Patient/not-a-uuid" } };

      const res = await lambdaHandler(makeEvent(JSON.stringify(invalidTask), VALID_HEADERS));

      expect(res.statusCode).toBe(400);
      expect(createFhirErrorResponse).toHaveBeenCalledWith(
        400,
        "invalid",
        "Invalid patient ID format",
        "error",
      );
    });

    it("returns 400 when order identifier value is not a valid UUID", async () => {
      const invalidTask = { ...validTask, identifier: [{ value: "not-a-uuid" }] };

      const res = await lambdaHandler(makeEvent(JSON.stringify(invalidTask), VALID_HEADERS));

      expect(res.statusCode).toBe(400);
      expect(createFhirErrorResponse).toHaveBeenCalledWith(
        400,
        "invalid",
        "Invalid identifier.value format",
        "error",
      );
    });
  });

  describe("order lookup", () => {
    it("returns 500 when orderStatusService.getPatientIdFromOrder throws", async () => {
      mockGetPatientIdFromOrder.mockRejectedValueOnce(new Error("DB connection failed"));

      const res = await lambdaHandler(
        makeEvent(JSON.stringify(validTask), { "X-Correlation-ID": VALID_CORRELATION_ID }),
      );

      expect(res.statusCode).toBe(500);
      expect(createFhirErrorResponse).toHaveBeenCalledWith(
        500,
        "exception",
        "An internal error occurred",
        "fatal",
      );
    });

    it("returns 404 when order is not found", async () => {
      mockGetPatientIdFromOrder.mockResolvedValueOnce(null);

      const res = await lambdaHandler(
        makeEvent(JSON.stringify(validTask), { "X-Correlation-ID": VALID_CORRELATION_ID }),
      );

      expect(res.statusCode).toBe(404);
      expect(createFhirErrorResponse).toHaveBeenCalledWith(
        404,
        "not-found",
        "Order not found",
        "error",
      );
    });
  });

  describe("patient authorisation", () => {
    it("returns 403 when patient UID in task does not match order record", async () => {
      mockGetPatientIdFromOrder.mockResolvedValueOnce("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11");

      const res = await lambdaHandler(
        makeEvent(JSON.stringify(validTask), { "X-Correlation-ID": VALID_CORRELATION_ID }),
      );

      expect(res.statusCode).toBe(403);
      expect(createFhirErrorResponse).toHaveBeenCalledWith(
        403,
        "forbidden",
        "Patient UID does not match order record",
        "error",
      );
    });
  });

  describe("Order status update", () => {
    beforeEach(() => {
      mockGetPatientIdFromOrder.mockResolvedValue(VALID_PATIENT_UUID);
    });

    it("returns 500 when OrderService.updateOrderStatusAndResultStatus throws", async () => {
      mockUpdateOrderStatusAndResultStatus.mockRejectedValueOnce(new Error("DB write failed"));

      const res = await lambdaHandler(makeEvent(JSON.stringify(validTask), validEventHeaders));

      expect(res.statusCode).toBe(500);
      expect(createFhirErrorResponse).toHaveBeenCalledWith(
        500,
        "exception",
        "An internal error occurred",
        "fatal",
      );
    });

    it("calls updateOrderStatusAndResultStatus with correct arguments", async () => {
      await lambdaHandler(makeEvent(JSON.stringify(validTask), validEventHeaders));

      expect(mockUpdateOrderStatusAndResultStatus).toHaveBeenCalledWith(
        VALID_ORDER_UUID,
        OrderStatus.Complete,
        ResultStatus.Result_Available,
        VALID_CORRELATION_ID,
      );
    });
  });

  describe("success", () => {
    it("returns 201 with the original task on success", async () => {
      mockGetPatientIdFromOrder.mockResolvedValue(VALID_PATIENT_UUID);

      const res = await lambdaHandler(makeEvent(JSON.stringify(validTask), validEventHeaders));

      expect(res.statusCode).toBe(201);
      expect(createFhirResponse).toHaveBeenCalledWith(
        201,
        expect.objectContaining({ resourceType: "Task" }),
      );
    });
  });
});
