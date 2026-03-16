import { APIGatewayProxyResult } from "aws-lambda";

export const jsonResponse = (
  statusCode: number,
  body: Record<string, unknown>,
  headers?: Record<string, string>,
): APIGatewayProxyResult => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    ...headers,
  },
  body: JSON.stringify(body),
});

export const fhirResponse = (
  statusCode: number,
  body: Record<string, unknown>,
): APIGatewayProxyResult => ({
  statusCode,
  headers: {
    "Content-Type": "application/fhir+json",
  },
  body: JSON.stringify(body),
});
