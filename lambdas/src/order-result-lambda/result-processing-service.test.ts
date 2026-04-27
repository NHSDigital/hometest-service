import { Observation } from "fhir/r4";

import { type LambdaClientInterface } from "../lib/lambda/lambda-client";
import { ResultProcessingHandoffService } from "./result-processing-service";

describe("ResultProcessingHandoffService", () => {
  const correlationId = "550e8400-e29b-41d4-a716-446655440002";
  const observation: Observation = {
    resourceType: "Observation",
    status: "final",
    code: {},
    valueString: "Negative",
  };

  it("invokes the result processing lambda with the validated observation", async () => {
    const lambdaClient: jest.Mocked<LambdaClientInterface> = {
      invoke: jest.fn().mockResolvedValue({
        statusCode: 200,
      }),
    };
    const service = new ResultProcessingHandoffService({
      lambdaClient,
      resultProcessingFunctionName: "hometest-service-hiv-results-processor",
    });

    await service.processValidatedResult({
      correlationId,
      observation,
    });

    expect(lambdaClient.invoke).toHaveBeenCalledWith(
      "hometest-service-hiv-results-processor",
      JSON.stringify({
        headers: {
          "x-correlation-id": correlationId,
        },
        body: JSON.stringify(observation),
      }),
    );
  });

  it("throws when the lambda invoke transport status is not 200", async () => {
    const lambdaClient: jest.Mocked<LambdaClientInterface> = {
      invoke: jest
        .fn()
        .mockRejectedValue(
          new Error("Result processing lambda invocation failed with status code 500"),
        ),
    };
    const service = new ResultProcessingHandoffService({
      lambdaClient,
      resultProcessingFunctionName: "hometest-service-hiv-results-processor",
    });

    await expect(
      service.processValidatedResult({
        correlationId,
        observation,
      }),
    ).rejects.toThrow("Result processing lambda invocation failed with status code 500");
  });

  it("throws when the downstream lambda returns a non-200 response status code", async () => {
    const lambdaClient: jest.Mocked<LambdaClientInterface> = {
      invoke: jest.fn().mockResolvedValue({
        statusCode: 400,
      }),
    };
    const service = new ResultProcessingHandoffService({
      lambdaClient,
      resultProcessingFunctionName: "hometest-service-hiv-results-processor",
    });

    await expect(
      service.processValidatedResult({
        correlationId,
        observation,
      }),
    ).rejects.toThrow("Result processing lambda returned status code 400");
  });

  it("propagates function errors raised by the lambda client", async () => {
    const lambdaClient: jest.Mocked<LambdaClientInterface> = {
      invoke: jest
        .fn()
        .mockRejectedValue(
          new Error("Result processing lambda returned a function error: Unhandled"),
        ),
    };
    const service = new ResultProcessingHandoffService({
      lambdaClient,
      resultProcessingFunctionName: "hometest-service-hiv-results-processor",
    });

    await expect(
      service.processValidatedResult({
        correlationId,
        observation,
      }),
    ).rejects.toThrow("Result processing lambda returned a function error: Unhandled");
  });

  it("propagates empty payload errors raised by the lambda client", async () => {
    const lambdaClient: jest.Mocked<LambdaClientInterface> = {
      invoke: jest
        .fn()
        .mockRejectedValue(new Error("Result processing lambda returned an empty payload")),
    };
    const service = new ResultProcessingHandoffService({
      lambdaClient,
      resultProcessingFunctionName: "hometest-service-hiv-results-processor",
    });

    await expect(
      service.processValidatedResult({
        correlationId,
        observation,
      }),
    ).rejects.toThrow("Result processing lambda returned an empty payload");
  });

  it("propagates invalid JSON errors raised by the lambda client", async () => {
    const lambdaClient: jest.Mocked<LambdaClientInterface> = {
      invoke: jest
        .fn()
        .mockRejectedValue(new Error("Result processing lambda returned invalid JSON")),
    };
    const service = new ResultProcessingHandoffService({
      lambdaClient,
      resultProcessingFunctionName: "hometest-service-hiv-results-processor",
    });

    await expect(
      service.processValidatedResult({
        correlationId,
        observation,
      }),
    ).rejects.toThrow("Result processing lambda returned invalid JSON");
  });

  it("propagates missing status code errors raised by the lambda client", async () => {
    const lambdaClient: jest.Mocked<LambdaClientInterface> = {
      invoke: jest
        .fn()
        .mockRejectedValue(new Error("Result processing lambda returned status code unknown")),
    };
    const service = new ResultProcessingHandoffService({
      lambdaClient,
      resultProcessingFunctionName: "hometest-service-hiv-results-processor",
    });

    await expect(
      service.processValidatedResult({
        correlationId,
        observation,
      }),
    ).rejects.toThrow("Result processing lambda returned status code unknown");
  });
});
