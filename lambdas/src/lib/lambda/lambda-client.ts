import { InvokeCommand, type InvokeCommandOutput, LambdaClient } from "@aws-sdk/client-lambda";

import { getAwsClientOptions } from "../aws/aws-client-config";

export interface InvokedLambdaResponse {
  statusCode: number;
  body?: string;
  headers?: Record<string, string>;
}

export interface LambdaClientInterface {
  invoke(functionName: string, payload: string): Promise<InvokedLambdaResponse>;
}

function decodePayload(payload?: Uint8Array): string | undefined {
  if (!payload) {
    return undefined;
  }

  return new TextDecoder().decode(payload);
}

function parseInvokedLambdaResponse(payload: string, functionName: string): InvokedLambdaResponse {
  let parsedPayload: unknown;

  try {
    parsedPayload = JSON.parse(payload);
  } catch (error) {
    throw new Error(`Lambda invocation for ${functionName} returned invalid JSON`, {
      cause: error,
    });
  }

  if (
    typeof parsedPayload !== "object" ||
    parsedPayload === null ||
    !("statusCode" in parsedPayload) ||
    typeof parsedPayload.statusCode !== "number"
  ) {
    throw new Error(`Lambda invocation for ${functionName} returned status code unknown`);
  }

  return parsedPayload as InvokedLambdaResponse;
}

export class AWSLambdaClient implements LambdaClientInterface {
  private readonly client: LambdaClient;

  constructor(region: string) {
    this.client = new LambdaClient(getAwsClientOptions(region));
  }

  async invoke(functionName: string, payload: string): Promise<InvokedLambdaResponse> {
    const command = new InvokeCommand({
      FunctionName: functionName,
      InvocationType: "RequestResponse",
      Payload: new TextEncoder().encode(payload),
    });

    const result: InvokeCommandOutput = await this.client.send(command);

    if (result.StatusCode !== 200) {
      throw new Error(
        `Lambda invocation for ${functionName} failed with status code ${result.StatusCode ?? "unknown"}`,
      );
    }

    if (result.FunctionError) {
      throw new Error(
        `Lambda invocation for ${functionName} returned a function error: ${result.FunctionError}`,
      );
    }

    const decodedPayload = decodePayload(result.Payload);

    if (!decodedPayload) {
      throw new Error(`Lambda invocation for ${functionName} returned an empty payload`);
    }

    return parseInvokedLambdaResponse(decodedPayload, functionName);
  }
}
