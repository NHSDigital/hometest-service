import middy from "@middy/core";
import cors from "@middy/http-cors";
import httpErrorHandler from "@middy/http-error-handler";
import httpSecurityHeaders from "@middy/http-security-headers";
import { type APIGatewayProxyEvent, type APIGatewayProxyResult } from "aws-lambda";

import { securityHeaders } from "../lib/http/security-headers";
import { defaultCorsOptions } from "../lib/security/cors-configuration";
import { init } from "./init";

const className = "handler";

export const lambdaHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  const { postcodeLookupService } = await init();
  if (event.queryStringParameters?.postcode === undefined) {
    return {
      statusCode: 400,
      body: "Invalid request, missing parameters",
    };
  }

  try {
    const postcode = event.queryStringParameters!.postcode!;

    const postcodeLookupResponse = await postcodeLookupService.performLookup(postcode);

    return {
      statusCode: 200,
      body: JSON.stringify(postcodeLookupResponse),
    };
  } catch (e) {
    const err = e as { cause?: { details?: { responseData?: unknown } } } | undefined;
    console.error(
      `${className} - Error in postcode lookup handler:`,
      err?.cause?.details?.responseData,
    );
    throw e;
  }
};

export const handler = middy(lambdaHandler)
  .use(httpSecurityHeaders(securityHeaders))
  .use(cors(defaultCorsOptions))
  .use(httpErrorHandler());
