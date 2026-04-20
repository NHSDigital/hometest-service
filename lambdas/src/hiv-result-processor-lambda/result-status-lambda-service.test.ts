import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import { Task } from "fhir/r4";

import { ResultStatusLambdaService } from "./result-status-lambda-service";

const mockSend = jest.fn();

jest.mock("@aws-sdk/client-lambda", () => ({
  InvokeCommand: jest.fn().mockImplementation((input) => ({ input })),
  LambdaClient: jest.fn().mockImplementation(() => ({
    send: mockSend,
  })),
}));

describe("ResultStatusLambdaService", () => {
  const taskPayload: Task = {
    resourceType: "Task",
    status: "completed",
    intent: "order",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("constructs the lambda client with the provided region", () => {
    new ResultStatusLambdaService("status-lambda", "eu-west-2");

    expect(LambdaClient).toHaveBeenCalledWith({ region: "eu-west-2" });
  });

  it("invokes the configured status lambda with the task payload", async () => {
    mockSend.mockResolvedValue({});
    const service = new ResultStatusLambdaService("status-lambda", "eu-west-2");

    const result = await service.sendTask(taskPayload);

    expect(InvokeCommand).toHaveBeenCalledWith({
      FunctionName: "status-lambda",
      Payload: Buffer.from(JSON.stringify(taskPayload)),
    });
    expect(mockSend).toHaveBeenCalledWith({
      input: {
        FunctionName: "status-lambda",
        Payload: Buffer.from(JSON.stringify(taskPayload)),
      },
    });
    expect(result).toEqual({
      resourceType: "OperationOutcome",
      issue: [
        {
          severity: "information",
          code: "informational",
          diagnostics: "Status update lambda invoked successfully",
        },
      ],
    });
  });

  it("returns an error outcome when the invoked lambda reports a function error", async () => {
    mockSend.mockResolvedValue({ FunctionError: "Unhandled" });
    const service = new ResultStatusLambdaService("status-lambda", "eu-west-2");

    const result = await service.sendTask(taskPayload);

    expect(result).toEqual({
      resourceType: "OperationOutcome",
      issue: [
        {
          severity: "error",
          code: "exception",
          diagnostics: "Status lambda returned an error: Unhandled",
        },
      ],
    });
  });

  it("returns a fatal outcome when invoking the lambda throws", async () => {
    mockSend.mockRejectedValue(new Error("network failure"));
    const service = new ResultStatusLambdaService("status-lambda", "eu-west-2");

    const result = await service.sendTask(taskPayload);

    expect(result).toEqual({
      resourceType: "OperationOutcome",
      issue: [
        {
          severity: "fatal",
          code: "exception",
          diagnostics: "Failed to invoke status lambda: network failure",
        },
      ],
    });
  });
});
