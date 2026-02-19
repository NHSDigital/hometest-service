import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import middy from "@middy/core";
import cors from "@middy/http-cors";
import httpErrorHandler from "@middy/http-error-handler";
import httpSecurityHeaders from "@middy/http-security-headers";
import { securityHeaders } from "../lib/http/security-headers";
import { defaultCorsOptions } from "../login-lambda/cors-configuration";
import { init } from "./init";
import { validatePostcodeFormat } from "./postcode-validator";
const name = "eligibility-lookup-lambda";
const { laLookupService, commons } = init();


export const lambdaHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  context.callbackWaitsForEmptyEventLoop = false;

  const postcode = event.queryStringParameters?.postcode;

  if (!postcode) {
    commons.logError(name, "Postcode parameter is required");
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Postcode parameter is required" }),
    };
  }

  const formatResult = validatePostcodeFormat(postcode);

  if (!formatResult.valid) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid postcode format" }),
    };
  }

  const formattedPostcode = formatResult.cleaned;

  try {
    const la = await laLookupService.lookupByPostcode(formattedPostcode);

    if (!la) {
      commons.logError(
        name,
        `No local authority found for ${formattedPostcode}`
      );
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: `No local authority found for ${formattedPostcode}`,
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(la),
    };
  } catch (error) {
    commons.logError(name, "Internal error", error as Record<string, any>);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "An internal error occurred" }),
    };
  }
};

export const handler = middy(lambdaHandler)
  .use(httpSecurityHeaders(securityHeaders))
  .use(cors(defaultCorsOptions))
  .use(httpErrorHandler());
