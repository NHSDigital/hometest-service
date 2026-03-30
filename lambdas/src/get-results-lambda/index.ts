import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  createFhirErrorResponse,
  createFhirResponse,
} from "../lib/fhir-response";

import { ObservationValidation } from "../lib/validators/observation-validation";
import cors from "@middy/http-cors";
import { corsOptions } from "./cors-configuration";
import { getCorrelationIdFromEventHeaders } from "../lib/utils/utils";
import { getResultsQueryParamsSchema } from "./schemas";
import httpErrorHandler from "@middy/http-error-handler";
import httpSecurityHeaders from "@middy/http-security-headers";
import { init } from "./init";
import middy from "@middy/core";
import { securityHeaders } from "../lib/http/security-headers";

export const lambdaHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  const correlationId = getCorrelationIdFromEventHeaders(event);
  const { testResultDbClient, supplierTestResultsService } = init();

  const validationResult = getResultsQueryParamsSchema.safeParse(
    event.queryStringParameters,
  );

  if (!validationResult.success) {
    const errorDetails = validationResult.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");

    return createFhirErrorResponse(400, "invalid", errorDetails);
  }

  const {
    order_id: orderId,
    nhs_number: nhsNumber,
    date_of_birth: dateOfBirth,
  } = validationResult.data;

  const testResult = await testResultDbClient.getResult(
    orderId,
    nhsNumber,
    dateOfBirth,
  );

  if (testResult?.status !== "RESULT_AVAILABLE") {
    return createFhirErrorResponse(
      404,
      "not-found",
      "The requested resource could not be found",
    );
  }

  const bundle = await supplierTestResultsService.getResults(
    orderId,
    testResult.supplier_id,
    correlationId,
  );

  const observation = bundle.entry?.[0]?.resource;

  if (!observation || !ObservationValidation.isNormalResult(observation)) {
    return createFhirErrorResponse(
      404,
      "not-found",
      "The requested resource could not be found",
    );
  }

  return createFhirResponse(200, observation);
};

export const handler = middy(lambdaHandler)
  .use(httpSecurityHeaders(securityHeaders))
  .use(cors(corsOptions))
  .use(httpErrorHandler());
