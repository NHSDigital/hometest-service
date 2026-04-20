import { APIGatewayProxyEvent } from "aws-lambda";

import { createFhirErrorResponse, createFhirResponse } from "../lib/fhir-response";
import { handler } from "./index";
import { InterpretationCode } from "./models";

// --- Mock init.ts ---
jest.mock("./init", () => {
  const initMock = {
    commons: {
      logInfo: jest.fn(),
      logError: jest.fn(),
    },
    resultStatusLambdaService: {
      sendTask: jest.fn(),
    },
  };
  return {
    init: () => initMock,
    initMock,
  };
});

// --- Mock task-builder.ts ---
jest.mock("./task-builder", () => ({
  buildTaskFromObservation: jest.fn(() => ({ mockTask: true })),
}));

// --- Mock validation-service.ts ---
jest.mock("./validation-service", () => ({
  extractInterpretationCodeFromFHIRObservation: jest.fn(),
}));

// --- Mock FHIR response helpers ---
jest.mock("../lib/fhir-response", () => ({
  createFhirErrorResponse: jest.fn((code, type, message, severity) => ({
    statusCode: code,
    body: JSON.stringify({
      issue: [{ code: type, diagnostics: message, severity }],
    }),
  })),
  createFhirResponse: jest.fn((code, resource) => ({
    statusCode: code,
    body: JSON.stringify(resource),
  })),
}));

const { initMock } = jest.requireMock("./init");
const { buildTaskFromObservation } = jest.requireMock("./task-builder");
const { extractInterpretationCodeFromFHIRObservation } = jest.requireMock("./validation-service");

describe("hiv-results-processor handler", () => {
  const observation = { resourceType: "Observation" };

  const event: APIGatewayProxyEvent = {
    path: "/hiv",
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
  });

  it("returns 400 for invalid JSON", async () => {
    const badEvent = { ...event, body: "{invalid json" };

    const res = await handler(badEvent as any);

    expect(res.statusCode).toBe(400);
    expect(createFhirErrorResponse).toHaveBeenCalled();
  });

  it("returns 200 and ignores reactive results", async () => {
    extractInterpretationCodeFromFHIRObservation.mockReturnValue(InterpretationCode.Abnormal);

    const res = await handler(event);

    expect(res.statusCode).toBe(200);
    expect(initMock.resultStatusLambdaService.sendTask).not.toHaveBeenCalled();
  });

  it("builds task and calls status lambda for negative results", async () => {
    extractInterpretationCodeFromFHIRObservation.mockReturnValue(InterpretationCode.Normal);

    const res = await handler(event);

    expect(buildTaskFromObservation).toHaveBeenCalledWith(observation);
    expect(initMock.resultStatusLambdaService.sendTask).toHaveBeenCalledWith({ mockTask: true });
    expect(res.statusCode).toBe(200);
  });

  it("returns 500 if status lambda invocation fails", async () => {
    extractInterpretationCodeFromFHIRObservation.mockReturnValue(InterpretationCode.Normal);
    initMock.resultStatusLambdaService.sendTask.mockRejectedValueOnce(new Error("fail"));

    const res = await handler(event);

    expect(res.statusCode).toBe(500);
    expect(createFhirErrorResponse).toHaveBeenCalled();
  });
});
