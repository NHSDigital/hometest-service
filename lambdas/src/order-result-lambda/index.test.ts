import { APIGatewayProxyEvent } from "aws-lambda";

import { createFhirErrorResponse, createFhirResponse } from "../lib/fhir-response";
import { lambdaHandler as handler } from "./index";
import { InterpretationCode } from "./models";

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
    orderStatusNotifyService: {
      dispatch: jest.fn(),
    },
    resultProcessingService: {
      processValidatedResult: jest.fn(),
    },
  };
  return {
    init: () => initMock,
    initMock,
  };
});

jest.mock("./validation-service", () => {
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
    orderStatusNotifyService: {
      dispatch: jest.Mock;
    };
    resultProcessingService: {
      processValidatedResult: jest.Mock;
    };
  };
};

const {
  extractAndValidateObservationFieldsMock,
  validateDBDataMock,
  extractInterpretationCodeFromFHIRObservationMock,
} = jest.requireMock("./validation-service") as {
  extractAndValidateObservationFieldsMock: jest.Mock;
  validateDBDataMock: jest.Mock;
  extractInterpretationCodeFromFHIRObservationMock: jest.Mock;
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
      success: true,
      data: {
        observation,
        identifiers,
      },
    });
    initMock.orderService.retrieveOrderDetails.mockResolvedValue({ patient_uid: "patient-uid-1" });
    validateDBDataMock.mockResolvedValue({ success: true, data: { isIdempotent: false } });
    extractInterpretationCodeFromFHIRObservationMock.mockReturnValue(InterpretationCode.Normal);
    initMock.orderService.updateOrderStatusAndResultStatus.mockResolvedValue(undefined);
    initMock.orderStatusNotifyService.dispatch.mockResolvedValue(undefined);
    initMock.resultProcessingService.processValidatedResult.mockResolvedValue(undefined);
  });

  it("returns 201 and resource on success", async () => {
    const res = await handler(event);
    expect(res.statusCode).toBe(201);
    expect(createFhirResponse).toHaveBeenCalledWith(201, observation);
  });

  it("returns error if validation fails", async () => {
    extractAndValidateObservationFieldsMock.mockReturnValueOnce({
      success: false,
      error: {
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
      success: false,
      error: {
        errorCode: 400,
        errorType: "invalid",
        errorMessage: "db fail",
        severity: "error",
      },
    });
    const res = await handler(event);
    expect(res.statusCode).toBe(400);
    expect(createFhirErrorResponse).toHaveBeenCalledWith(400, "invalid", "db fail", "error");
  });

  it("returns 201 if idempotent", async () => {
    validateDBDataMock.mockResolvedValueOnce({ success: true, data: { isIdempotent: true } });
    const res = await handler(event);
    expect(res.statusCode).toBe(201);
    expect(createFhirResponse).toHaveBeenCalledWith(201, observation);
  });

  it("delegates validated results to result processing service", async () => {
    await handler(event);
    expect(initMock.resultProcessingService.processValidatedResult).toHaveBeenCalledWith(
      expect.objectContaining({
        correlationId: identifiers.correlationId,
        observation,
      }),
    );
  });

  it("dispatches a notification for normal results", async () => {
    await handler(event);
    expect(initMock.orderStatusNotifyService.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: identifiers.orderUid,
        patientId: expect.any(String),
        correlationId: identifiers.correlationId,
        statusCode: "COMPLETE",
      }),
    );
  });

  it("does not dispatch a notification for abnormal results", async () => {
    extractInterpretationCodeFromFHIRObservationMock.mockReturnValueOnce(
      InterpretationCode.Abnormal,
    );
    await handler(event);
    expect(initMock.orderStatusNotifyService.dispatch).not.toHaveBeenCalled();
  });

  it("returns 500 if result processing throws", async () => {
    initMock.resultProcessingService.processValidatedResult.mockRejectedValueOnce(
      new Error("fail"),
    );
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
