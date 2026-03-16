import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { jsonResponse } from "../utils/response";

/**
 * Mock Postcode Lookup endpoint.
 *
 * GET /mock/postcode/{postcode}
 *
 * Returns a fake local authority mapping for the given postcode.
 * The response shape matches the external postcode lookup API used by
 * the postcode-lookup-lambda.
 *
 * Supports X-Mock-Status header:
 *   - "404" → postcode not found
 *   - "400" → invalid postcode
 */

/** Known postcodes for deterministic testing */
const POSTCODE_MAP: Record<string, { code: string; name: string }> = {
  "SW1A 1AA": { code: "E09000033", name: "City of Westminster" },
  "SW1A1AA": { code: "E09000033", name: "City of Westminster" },
  "EC1A 1BB": { code: "E09000001", name: "City of London" },
  "EC1A1BB": { code: "E09000001", name: "City of London" },
  "LS1 1UR": { code: "E08000035", name: "Leeds" },
  "LS11UR": { code: "E08000035", name: "Leeds" },
  "M1 1AA": { code: "E08000003", name: "Manchester" },
  "M11AA": { code: "E08000003", name: "Manchester" },
  "B1 1BB": { code: "E08000025", name: "Birmingham" },
  "B11BB": { code: "E08000025", name: "Birmingham" },
};

const DEFAULT_LA = { code: "E09000999", name: "Mock Local Authority" };

export const handlePostcode = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  const mockStatus = event.headers?.["X-Mock-Status"] ?? event.headers?.["x-mock-status"];

  // Extract postcode from path: /mock/postcode/{postcode}
  const pathMatch = event.path.match(/^\/mock\/postcode\/(.+)$/);
  const postcode = decodeURIComponent(pathMatch?.[1] ?? "").toUpperCase().trim();

  if (mockStatus === "400" || !postcode) {
    return jsonResponse(400, {
      error: "Bad Request",
      message: "Invalid postcode format",
    });
  }

  if (mockStatus === "404") {
    return jsonResponse(404, {
      error: "Not Found",
      message: `Postcode '${postcode}' not found`,
    });
  }

  const localAuthority = POSTCODE_MAP[postcode] ?? DEFAULT_LA;

  return jsonResponse(200, {
    postcode,
    localAuthority,
    country: "England",
    region: "Mock Region",
  });
};
