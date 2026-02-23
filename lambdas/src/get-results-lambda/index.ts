import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { Bundle, Observation } from "fhir/r4";
import {
  createFhirErrorResponse,
  createFhirResponse,
} from "../lib/fhir-response";

import { OAuthSupplierAuthClient } from "../lib/supplier/supplier-auth-client";
import cors from "@middy/http-cors";
import { defaultCorsOptions } from "./cors-configuration";
import { getResultsQueryParamsSchema } from "./schemas";
import httpErrorHandler from "@middy/http-error-handler";
import httpSecurityHeaders from "@middy/http-security-headers";
import { init } from "./init";
import middy from "@middy/core";
import { securityHeaders } from "../lib/http/security-headers";
import { v4 as uuidv4 } from "uuid";

export const lambdaHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  const { httpClient, testResultDbClient, supplierDb, secretsClient } = init();

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

  if (!testResult || testResult.status !== "RESULT_AVAILABLE") {
    return createFhirErrorResponse(
      404,
      "not-found",
      "The requested resource could not be found",
    );
  }

  const serviceConfig = await supplierDb.getSupplierConfigBySupplierId(
    testResult.supplier_id,
  );

  if (!serviceConfig) {
    throw new Error("Missing supplier config");
  }

  const supplierAuthClient = new OAuthSupplierAuthClient(
    httpClient,
    secretsClient,
    serviceConfig.serviceUrl,
    serviceConfig.oauthTokenPath,
    serviceConfig.clientId,
    serviceConfig.clientSecretName,
    serviceConfig.oauthScope,
  );

  const accessToken = await supplierAuthClient.getAccessToken();

  const resultsUrl = `${serviceConfig.serviceUrl.replace(/\/$/, "")}/results`;

  const url = new URL(resultsUrl);
  url.searchParams.append("order_uid", orderId);

  const correlationId = uuidv4();
  const response = await httpClient.get<Bundle<Observation>>(url.toString(), {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/fhir+json",
    "X-Correlation-ID": correlationId,
  });

  const observation = response.entry?.[0]?.resource;
  const isNormal = observation?.interpretation?.[0].coding?.[0].code === "N";

  if (!isNormal || !observation) {
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
  .use(cors(defaultCorsOptions))
  .use(httpErrorHandler());
