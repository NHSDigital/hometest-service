import middy from "@middy/core";
import cors from "@middy/http-cors";
import httpErrorHandler from "@middy/http-error-handler";
import httpSecurityHeaders from "@middy/http-security-headers";
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";

import { securityHeaders } from "../lib/http/security-headers";
import { corsOptions } from "./cors-configuration";
import { init } from "./init";
import { validatePostcodeFormat } from "./postcode-validator";

const name = "eligibility-lookup-lambda";

export const lambdaHandler = async (
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  const { laLookupService, supplierDb, commons } = init();
  context.callbackWaitsForEmptyEventLoop = false;

  const postcode = event.queryStringParameters?.postcode;
  if (!postcode) return errorResponse(400, "Postcode parameter is required");

  const formatResult = validatePostcodeFormat(postcode);
  if (!formatResult.valid) return errorResponse(400, "Invalid postcode format");

  try {
    const la = await laLookupService.lookupByPostcode(formatResult.cleaned);
    if (!la) {
      return errorResponse(404, `No local authority found for ${formatResult.cleaned}`);
    }

    const laCode = la.localAuthorityCode;
    // ALPHA: we are not checking if suppliers are for the specific test
    const testCode = undefined;
    const suppliers = await supplierDb.getSuppliersByLocalAuthorityAndTest(laCode, testCode);
    if (!suppliers || suppliers.length === 0) {
      return errorResponse(404, `No supplier found for LA code ${laCode}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        localAuthority: la,
        suppliers: suppliers.map((s) => ({
          id: s.organization.id,
          name: s.organization.name,
          testCode: s.testCode,
        })),
      }),
    };
  } catch (err: any) {
    commons.logError(name, "Internal error", err);
    return errorResponse(500, err.message || "An internal error occurred");
  }
};

function errorResponse(statusCode: number, message: string): APIGatewayProxyResult {
  return { statusCode, body: JSON.stringify({ error: message }) };
}

export const handler = middy(lambdaHandler)
  .use(httpSecurityHeaders(securityHeaders))
  .use(cors(corsOptions))
  .use(httpErrorHandler());
