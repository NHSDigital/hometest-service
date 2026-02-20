import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import middy from "@middy/core";
import cors from "@middy/http-cors";
import httpErrorHandler from "@middy/http-error-handler";
import httpSecurityHeaders from "@middy/http-security-headers";
import { securityHeaders } from "../lib/http/security-headers";
import { defaultCorsOptions } from "../login-lambda/cors-configuration";
import { init } from "./init";
import { validatePostcodeFormat } from "./postcode-validator";

const name = "eligibility-lookup-lambda";
const { laLookupService, supplierDb, commons } = init();

export const lambdaHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  context.callbackWaitsForEmptyEventLoop = false;

  const postcode = event.queryStringParameters?.postcode;
  if (!postcode) return errorResponse(400, "Postcode parameter is required");

  const formatResult = validatePostcodeFormat(postcode);
  if (!formatResult.valid) return errorResponse(400, "Invalid postcode format");

  try {
    const la = await getLocalAuthority(formatResult.cleaned);
    const suppliers = await getSuppliersForLa(la.localAuthorityCode);

    return {
      statusCode: 200,
      body: JSON.stringify({
        localAuthority: la,
        suppliers: suppliers.map(s => ({
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

async function getLocalAuthority(postcode: string) {
  const la = await laLookupService.lookupByPostcode(postcode);
  if (!la) throw new Error(`No local authority found for ${postcode}`);
  return la;
}

async function getSuppliersForLa(laCode: string) {
  const suppliers = await supplierDb.getSuppliersByLocalAuthorityAndTest(laCode);
  if (!suppliers || suppliers.length === 0) throw new Error(`No supplier found for LA code ${laCode}`);
  return suppliers;
}

function errorResponse(statusCode: number, message: string): APIGatewayProxyResult {
  return { statusCode, body: JSON.stringify({ error: message }) };
}

export const handler = middy(lambdaHandler)
  .use(httpSecurityHeaders(securityHeaders))
  .use(cors(defaultCorsOptions))
  .use(httpErrorHandler());
