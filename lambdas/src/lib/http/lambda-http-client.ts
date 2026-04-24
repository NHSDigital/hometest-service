import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

import { HttpClient, HttpError } from "./http-client";

const buildApiGatewayEvent = (
  method: "GET" | "POST",
  path: string,
  headers: Record<string, string>,
  body: string | null,
): Partial<APIGatewayProxyEvent> => ({
  httpMethod: method,
  path,
  headers,
  body,
  multiValueHeaders: {},
  queryStringParameters: null,
  multiValueQueryStringParameters: null,
  pathParameters: null,
  stageVariables: null,
  requestContext: {} as APIGatewayProxyEvent["requestContext"],
  resource: "",
  isBase64Encoded: false,
});

const decodePayload = (payload: Uint8Array | undefined): APIGatewayProxyResult => {
  if (!payload) {
    throw new HttpError("Lambda invocation returned no payload", 500);
  }
  return JSON.parse(Buffer.from(payload).toString("utf-8")) as APIGatewayProxyResult;
};

const serializeBody = (body: unknown): string | null => {
  if (body == null) return null;
  if (typeof body === "string") return body;
  return JSON.stringify(body);
};

export class LambdaHttpClient implements HttpClient {
  constructor(
    private readonly client: LambdaClient,
    private readonly functionName: string,
  ) {}

  async get<T>(url: string, headers?: Record<string, string>): Promise<T> {
    const event = buildApiGatewayEvent(
      "GET",
      url,
      { Accept: "application/json", ...headers },
      null,
    );

    const command = new InvokeCommand({
      FunctionName: this.functionName,
      InvocationType: "RequestResponse",
      Payload: Buffer.from(JSON.stringify(event)),
    });

    const response = await this.client.send(command);

    if (response.FunctionError) {
      throw new HttpError(`Error sending request to ${this.functionName} ${url}`, 500);
    }

    const result = decodePayload(response.Payload);

    const status = result.statusCode;
    const body = result.body;

    if (status < 200 || status >= 300) {
      throw new HttpError(
        `HTTP GET: Error response from ${this.functionName} ${url} `,
        status,
        body,
      );
    }

    return JSON.parse(body) as T;
  }

  async post<T>(
    url: string,
    body: unknown,
    headers: Record<string, string> = {},
    contentType: string = "application/json",
  ): Promise<T> {
    const event = buildApiGatewayEvent(
      "POST",
      url,
      { Accept: "application/json", "Content-Type": contentType, ...headers },
      serializeBody(body),
    );

    const command = new InvokeCommand({
      FunctionName: this.functionName,
      InvocationType: "RequestResponse",
      Payload: Buffer.from(JSON.stringify(event)),
    });

    const response = await this.client.send(command);

    if (response.FunctionError) {
      throw new HttpError(`Error sending request to ${this.functionName} ${url}`, 500);
    }

    const result = decodePayload(response.Payload);

    const statusCode = result.statusCode;
    const resultBody = result.body;
    if (statusCode < 200 || statusCode >= 300) {
      throw new HttpError(
        `HTTP POST: Error response from ${this.functionName} ${url}`,
        statusCode,
        resultBody,
      );
    }

    return JSON.parse(resultBody) as T;
  }

  async postRaw(
    url: string,
    body: unknown,
    headers: Record<string, string> = {},
    contentType: string = "application/json",
  ): Promise<Response> {
    const event = buildApiGatewayEvent(
      "POST",
      url,
      { Accept: "application/json", "Content-Type": contentType, ...headers },
      serializeBody(body),
    );

    const command = new InvokeCommand({
      FunctionName: this.functionName,
      InvocationType: "RequestResponse",
      Payload: Buffer.from(JSON.stringify(event)),
    });

    const response = await this.client.send(command);

    if (response.FunctionError) {
      throw new HttpError(`Error sending request to ${this.functionName} ${url}`, 500);
    }

    const result = decodePayload(response.Payload);

    const statusCode = result.statusCode;
    const resultBody = result.body;
    if (statusCode < 200 || statusCode >= 300) {
      throw new HttpError(
        `HTTP POST: Error response from ${this.functionName} ${url}`,
        statusCode,
        resultBody,
      );
    }

    return new Response(resultBody, {
      status: statusCode,
      headers: result.headers as Record<string, string>,
    });
  }
}
