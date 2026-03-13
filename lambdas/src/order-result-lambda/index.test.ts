import { OrderStatus, ResultStatus } from "../lib/types/status";
import { createFhirErrorResponse, createFhirResponse } from "../lib/fhir-response";

import { APIGatewayProxyEvent } from "aws-lambda";
import { InterpretationCode } from "./models";
import { handler } from "./index";

jest.mock("./init", () => {
  const initMock = {
    commons: {
      logInfo: jest.fn(),
      logError: jest.fn(),
    },
    orderService: {
      retrieveOrderDetails: jest.fn(),
      updateOrderStatusAndResultStatus: jest.fn(),
    },
  };
  return {
    init: () => initMock,
    initMock,
  };
});

jest.mock("./validation", () => {
  const extractAndValidateObservationFieldsMock = jest.fn();
  const extractInterpretationCodeFromFHIRObservationMock = jest.fn();
  const validateDBDataMock = jest.fn();
  return {
    extractAndValidateObservationFields: extractAndValidateObservationFieldsMock,
    extractInterpretationCodeFromFHIRObservation: extractInterpretationCodeFromFHIRObservationMock,
    validateDBData: validateDBDataMock,
    extractAndValidateObservationFieldsMock,
    extractInterpretationCodeFromFHIRObservationMock,
    validateDBDataMock,
  };
});

jest.mock("../lib/fhir-response", () => ({
  createFhirErrorResponse: jest.fn((code, type, message, severity) => ({
    statusCode: code,
    body: JSON.stringify({
      issue: [
        {
          code: type,
          diagnostics: message,
          severity,
        },
      ],
    }),
  })),
  createFhirResponse: jest.fn((code, resource) => ({
    statusCode: code,
    body: JSON.stringify(resource),
  })),
  ErrorStatusCode: {
    BadRequest: 400,
    NotFound: 404,
    Internal: 500,
  },
}));

const { initMock } = jest.requireMock("./init") as {
  initMock: {
    commons: {
      logInfo: jest.Mock;
      logError: jest.Mock;
    };
    orderService: {
      retrieveOrderDetails: jest.Mock;
      updateOrderStatusAndResultStatus: jest.Mock;
    };
  };
};

const {
  extractAndValidateObservationFieldsMock,
  extractInterpretationCodeFromFHIRObservationMock,
  validateDBDataMock,
} = jest.requireMock("./validation") as {
  extractAndValidateObservationFieldsMock: jest.Mock;
  extractInterpretationCodeFromFHIRObservationMock: jest.Mock;
  validateDBDataMock: jest.Mock;
};

describe("order-result-lambda handler", () => {
  const identifiers = {
    orderUid: "order-uid-1",
    patientId: "patient-1",
    supplierId: "supplier-1",
    correlationId: "corr-1",
  };
  const observation = { resourceType: "Observation", status: "final" };
  const event: APIGatewayProxyEvent = {
    path: "/result",
    httpMethod: "POST",
    body: JSON.stringify(observation),
    headers: {},
    isBase64Encoded: false,
    multiValueHeaders: {},
    multiValueQueryStringParameters: null,
    queryStringParameters: null,
    pathParameters: null,
    stageVariables: null,
    requestContext: {} as any,
    resource: "",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    extractAndValidateObservationFieldsMock.mockReturnValue({
      validationResult: { isValid: true },
      observation,
      identifiers,
    });
    initMock.orderService.retrieveOrderDetails.mockResolvedValue({});
    validateDBDataMock.mockResolvedValue({ isValid: true, isIdempotent: false });
    extractInterpretationCodeFromFHIRObservationMock.mockReturnValue(InterpretationCode.Normal);
    initMock.orderService.updateOrderStatusAndResultStatus.mockResolvedValue(undefined);
  });

  it("returns 201 and resource on success", async () => {
    const res = await handler(event);
    expect(res.statusCode).toBe(201);
    expect(createFhirResponse).toHaveBeenCalledWith(201, observation);
  });

  it("returns error if validation fails", async () => {
    extractAndValidateObservationFieldsMock.mockReturnValueOnce({
      validationResult: {
        isValid: false,
        errorCode: 400,
        errorType: "invalid",
        errorMessage: "fail",
        severity: "error",
      },
    });
    const res = await handler(event);
    expect(res.statusCode).toBe(400);
    expect(createFhirErrorResponse).toHaveBeenCalledWith(400, "invalid", "fail", "error");
  });

  it("returns 404 if order not found", async () => {
    initMock.orderService.retrieveOrderDetails.mockResolvedValueOnce(null);
    const res = await handler(event);
    expect(res.statusCode).toBe(404);
    expect(createFhirErrorResponse).toHaveBeenCalledWith(
      404,
      "not-found",
      expect.stringContaining("No order found"),
      "error",
    );
  });

  it("returns error if db validation fails", async () => {
    validateDBDataMock.mockResolvedValueOnce({
      isValid: false,
      errorCode: 400,
      errorType: "invalid",
      errorMessage: "db fail",
      severity: "error",
    });
    const res = await handler(event);
    expect(res.statusCode).toBe(400);
    expect(createFhirErrorResponse).toHaveBeenCalledWith(400, "invalid", "db fail", "error");
  });

  it("returns 201 if idempotent", async () => {
    validateDBDataMock.mockResolvedValueOnce({ isValid: true, isIdempotent: true });
    const res = await handler(event);
    expect(res.statusCode).toBe(201);
    expect(createFhirResponse).toHaveBeenCalledWith(201, observation);
  });

  it("calls updateOrderStatusAndResultStatus for interpretation code normal with order status complete and result available", async () => {
    extractInterpretationCodeFromFHIRObservationMock.mockReturnValueOnce(InterpretationCode.Normal);
    await handler(event);
    expect(initMock.orderService.updateOrderStatusAndResultStatus).toHaveBeenCalledWith(
      identifiers.orderUid,
      OrderStatus.Complete,
      ResultStatus.Result_Available,
      identifiers.correlationId,
    );
  });

  it("calls updateOrderStatusAndResultStatus for interpretation code abnormal with result withheld", async () => {
    extractInterpretationCodeFromFHIRObservationMock.mockReturnValueOnce(
      InterpretationCode.Abnormal,
    );
    await handler(event);
    expect(initMock.orderService.updateOrderStatusAndResultStatus).toHaveBeenCalledWith(
      identifiers.orderUid,
      OrderStatus.Received,
      ResultStatus.Result_Withheld,
      identifiers.correlationId,
    );
  });

  it("returns 500 if updateDatabase throws", async () => {
    initMock.orderService.updateOrderStatusAndResultStatus.mockRejectedValueOnce(new Error("fail"));
    const res = await handler(event);
    expect(res.statusCode).toBe(500);
    expect(createFhirErrorResponse).toHaveBeenCalledWith(
      500,
      "exception",
      "An internal error occurred",
      "fatal",
    );
  });
});
