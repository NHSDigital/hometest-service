import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  createFhirErrorResponse,
  createFhirResponse,
} from "../lib/fhir-response";

import { OrderBundleBuilder } from "./order-bundle-builder";
import cors from "@middy/http-cors";
import { defaultCorsOptions } from "./cors-configuration";
import { getOrderQueryParamsSchema } from "./schemas";
import httpErrorHandler from "@middy/http-error-handler";
import httpSecurityHeaders from "@middy/http-security-headers";
import { init } from "./init";
import middy from "@middy/core";
import { securityHeaders } from "../lib/http/security-headers";

export const lambdaHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  const { orderDbClient } = init();

  const validationResult = getOrderQueryParamsSchema.safeParse(
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

  const order = await orderDbClient.getOrder(orderId, nhsNumber, dateOfBirth);

  if (!order) {
    return createFhirErrorResponse(
      404,
      "not-found",
      "The requested resource could not be found",
    );
  }

  const bundle = OrderBundleBuilder.buildBundle(order);

  return createFhirResponse(200, bundle);
};

export const handler = middy(lambdaHandler)
  .use(httpSecurityHeaders(securityHeaders))
  .use(cors(defaultCorsOptions))
  .use(httpErrorHandler());
