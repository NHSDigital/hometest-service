import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";

import { AWSLambdaClient } from "./lambda-client";

jest.mock("@aws-sdk/client-lambda");

describe("AWSLambdaClient", () => {
  const mockSend = jest.fn();

  beforeEach(() => {
    (LambdaClient as jest.Mock).mockImplementation(() => ({
      send: mockSend,
      destroy: jest.fn(),
    }));
    mockSend.mockReset();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("invokes a lambda and returns the decoded response payload", async () => {
    const client = new AWSLambdaClient("eu-west-2");
    const payload = JSON.stringify({
      statusCode: 200,
      body: JSON.stringify({ processed: true }),
      headers: { "content-type": "application/json" },
    });

    mockSend.mockResolvedValueOnce({
      StatusCode: 200,
      Payload: new TextEncoder().encode(payload),
    });

    const result = await client.invoke("result-processor", payload);

    expect(result).toEqual({
      statusCode: 200,
      body: JSON.stringify({ processed: true }),
      headers: { "content-type": "application/json" },
    });
    expect(mockSend).toHaveBeenCalledWith(expect.any(InvokeCommand));
  });

  it("throws when the invoke transport status is not 200", async () => {
    const client = new AWSLambdaClient("eu-west-2");

    mockSend.mockResolvedValueOnce({
      StatusCode: 500,
      Payload: new TextEncoder().encode("{}"),
    });

    await expect(client.invoke("result-processor", "{}")).rejects.toThrow(
      "Lambda invocation for result-processor failed with status code 500",
    );
  });

  it("throws when Lambda reports a function error", async () => {
    const client = new AWSLambdaClient("eu-west-2");

    mockSend.mockResolvedValueOnce({
      StatusCode: 200,
      Payload: new TextEncoder().encode("{}"),
      FunctionError: "Unhandled",
    });

    await expect(client.invoke("result-processor", "{}")).rejects.toThrow(
      "Lambda invocation for result-processor returned a function error: Unhandled",
    );
  });

  it("throws when Lambda returns an empty payload", async () => {
    const client = new AWSLambdaClient("eu-west-2");

    mockSend.mockResolvedValueOnce({
      StatusCode: 200,
    });

    await expect(client.invoke("result-processor", "{}")).rejects.toThrow(
      "Lambda invocation for result-processor returned an empty payload",
    );
  });

  it("throws when Lambda returns invalid JSON", async () => {
    const client = new AWSLambdaClient("eu-west-2");

    mockSend.mockResolvedValueOnce({
      StatusCode: 200,
      Payload: new TextEncoder().encode("not-json"),
    });

    await expect(client.invoke("result-processor", "{}")).rejects.toThrow(
      "Lambda invocation for result-processor returned invalid JSON",
    );
  });

  it("throws when Lambda response omits statusCode", async () => {
    const client = new AWSLambdaClient("eu-west-2");

    mockSend.mockResolvedValueOnce({
      StatusCode: 200,
      Payload: new TextEncoder().encode(JSON.stringify({ body: "ok" })),
    });

    await expect(client.invoke("result-processor", "{}")).rejects.toThrow(
      "Lambda invocation for result-processor returned status code unknown",
    );
  });

  it("propagates invocation errors", async () => {
    const client = new AWSLambdaClient("eu-west-2");

    mockSend.mockRejectedValueOnce(new Error("Invoke failed"));

    await expect(client.invoke("result-processor", "{}")).rejects.toThrow("Invoke failed");
  });
});
