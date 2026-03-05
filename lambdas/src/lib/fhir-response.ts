import { APIGatewayProxyResult } from "aws-lambda";
import { Resource, OperationOutcome, OperationOutcomeIssue } from "fhir/r4";

const FHIR_CONTENT_TYPE = "application/fhir+json";

/**
 * Creates a successful FHIR response
 */
export const createFhirResponse = (
  statusCode: number,
  resource: Resource,
): APIGatewayProxyResult => {
  return {
    statusCode,
    headers: { "Content-Type": FHIR_CONTENT_TYPE },
    body: JSON.stringify(resource),
  };
};

export type ErrorStatusCode =
  | 400
  | 401
  | 403
  | 404
  | 405
  | 408
  | 409
  | 410
  | 415
  | 422
  | 429
  | 500
  | 501
  | 502
  | 503
  | 504;

/**
 * Creates a FHIR OperationOutcome error response
 */
export const createFhirErrorResponse = (
  statusCode: ErrorStatusCode,
  code: OperationOutcomeIssue["code"],
  diagnostics: string,
  severity: OperationOutcomeIssue["severity"] = "error",
): APIGatewayProxyResult => {
  const outcome: OperationOutcome = {
    resourceType: "OperationOutcome",
    issue: [
      {
        severity,
        code,
        diagnostics,
      },
    ],
  };

  return createFhirResponse(statusCode, outcome);
};
