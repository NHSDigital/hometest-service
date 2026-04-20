import { Task } from "fhir/r4";

import { HttpClient, HttpError } from "../lib/http/http-client";
import { ResultStatusLambdaService } from "./result-status-lambda-service";

const mockPost = jest.fn();
const mockHttpClient: HttpClient = {
  get: jest.fn(),
  post: mockPost,
  postRaw: jest.fn(),
};

describe("ResultStatusLambdaService", () => {
  const taskPayload: Task = {
    resourceType: "Task",
    status: "completed",
    intent: "order",
  };

  const correlationId = "test-correlation-id";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("posts the task payload to the correct path with the correlation ID header", async () => {
    mockPost.mockResolvedValueOnce({});
    const service = new ResultStatusLambdaService(mockHttpClient);

    await service.sendResult(taskPayload, correlationId);

    expect(mockPost).toHaveBeenCalledWith(
      "result/status",
      taskPayload,
      { "X-Correlation-Id": correlationId },
      "application/fhir+json",
    );
  });

  it("uses 'null' as correlation ID when none is provided", async () => {
    mockPost.mockResolvedValueOnce({});
    const service = new ResultStatusLambdaService(mockHttpClient);

    await service.sendResult(taskPayload);

    expect(mockPost).toHaveBeenCalledWith(
      "result/status",
      taskPayload,
      { "X-Correlation-Id": "null" },
      "application/fhir+json",
    );
  });

  it("returns a success OperationOutcome when the post succeeds", async () => {
    mockPost.mockResolvedValueOnce({});
    const service = new ResultStatusLambdaService(mockHttpClient);

    const result = await service.sendResult(taskPayload, correlationId);

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

  it("returns an OperationOutcome when the post throws an HttpError", async () => {
    mockPost.mockRejectedValueOnce(new HttpError("Not found", 404, "not found"));
    const service = new ResultStatusLambdaService(mockHttpClient);

    const result = await service.sendResult(taskPayload, correlationId);

    expect(result).toEqual({
      resourceType: "OperationOutcome",
      issue: [
        {
          severity: "fatal",
          code: "exception",
          diagnostics: "Failed to invoke status lambda: Not found",
        },
      ],
    });
  });

  it("returns an OperationOutcome when the post throws an unexpected error", async () => {
    mockPost.mockRejectedValueOnce(new Error("network failure"));
    const service = new ResultStatusLambdaService(mockHttpClient);

    const result = await service.sendResult(taskPayload, correlationId);

    expect(result).toEqual({
      resourceType: "OperationOutcome",
      issue: [
        {
          severity: "fatal",
          code: "exception",
          diagnostics: `Failed to invoke status lambda: network failure`,
        },
      ],
    });
  });
});
