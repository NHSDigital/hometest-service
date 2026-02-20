import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  createFhirErrorResponse,
  createFhirResponse,
} from "../lib/fhir-response";

import { ObservationBuilder } from "./observation-builder";
import cors from "@middy/http-cors";
import { defaultCorsOptions } from "./cors-configuration";
import { getResultsQueryParamsSchema } from "./schemas";
import httpErrorHandler from "@middy/http-error-handler";
import httpSecurityHeaders from "@middy/http-security-headers";
import { init } from "./init";
import middy from "@middy/core";
import { securityHeaders } from "../lib/http/security-headers";

export const lambdaHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  const { testResultDbClient } = init();

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

  // for Alpha we only return observation if RESULT_AVAILABLE
  // and the returned observation is 'Not detected' with an interpretation of 'Normal'
  if (!testResult || testResult.status !== "RESULT_AVAILABLE") {
    return createFhirErrorResponse(
      404,
      "not-found",
      "The requested resource could not be found",
    );
  }

  const observation = ObservationBuilder.build(testResult);

  return createFhirResponse(200, observation);
};

export const handler = middy(lambdaHandler)
  .use(httpSecurityHeaders(securityHeaders))
  .use(cors(defaultCorsOptions))
  .use(httpErrorHandler());
