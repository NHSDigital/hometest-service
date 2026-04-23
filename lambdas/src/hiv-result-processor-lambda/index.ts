import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { Observation } from "fhir/r4";

import { createFhirErrorResponse, createFhirResponse } from "../lib/fhir-response";
import { init } from "./init";
import { InterpretationCode } from "./models";
import { buildTaskFromObservation } from "./task-builder";
import { extractInterpretationCodeFromFHIRObservation } from "./validation-service";
import { getCorrelationIdFromEventHeaders } from "../lib/utils/utils";

const { commons, resultStatusLambdaService } = init();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  commons.logInfo("hiv-results-processor", "Received HIV result", {
    path: event.path,
    method: event.httpMethod,
  });

  const correlationId = getCorrelationIdFromEventHeaders(event);

  if (!correlationId) {
    commons.logError("hiv-results-processor", "Missing correlation ID in request headers");
    return createFhirErrorResponse(400, "invalid", "Missing correlation ID", "error");
  }

  // 1. Parse Observation directly (no validation)
  let observation: Observation;
  try {
    observation = JSON.parse(event.body ?? "");
  } catch (error) {
    commons.logError("hiv-results-processor", "Invalid JSON in request body", { error });
    return createFhirErrorResponse(400, "invalid", "Invalid JSON body", "error");
  }

  // 2. Extract interpretation code ("N" or "A")
  const interpretation = extractInterpretationCodeFromFHIRObservation(observation);

  // 3. If reactive (A) → ignore
  if (interpretation === InterpretationCode.Abnormal) {
    commons.logInfo("hiv-results-processor", "Reactive result ignored");
    return createFhirResponse(200, observation);
  }

  // 4. If negative (N) → build Task + send to status lambda
  if (interpretation === InterpretationCode.Normal) {
    try {
      // This is now complete
      // TODO find the correlation id from the request headers, pass it here, and remove the nullability of that parameter
      const taskPayload = buildTaskFromObservation(observation, correlationId);
      await resultStatusLambdaService.sendResult(taskPayload);

      return createFhirResponse(200, observation);
    } catch (error) {
      commons.logError("hiv-results-processor", "Failed to send task to status lambda", { error });
      return createFhirErrorResponse(500, "exception", "Status update failed", "fatal");
    }
  }

  // 5. Fallback (should not happen)
  return createFhirResponse(200, observation);
};
