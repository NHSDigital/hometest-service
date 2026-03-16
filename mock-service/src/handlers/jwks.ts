import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { jsonResponse } from "../utils/response";
import * as crypto from "crypto";

/**
 * Mock Cognito JWKS endpoint.
 *
 * GET /mock/cognito/.well-known/jwks.json
 *
 * Returns a JSON Web Key Set containing a single RSA public key.
 * The matching private key (in MOCK_JWKS_PRIVATE_KEY env var) can be used
 * to sign test JWTs that will validate against this JWKS.
 *
 * On cold start, generates a fresh RSA key pair unless MOCK_JWKS_PRIVATE_KEY
 * is provided — this lets all dev services share the same signing key.
 */

let cachedKeyPair: { publicKey: crypto.KeyObject; privateKey: crypto.KeyObject } | null = null;

const getKeyPair = (): { publicKey: crypto.KeyObject; privateKey: crypto.KeyObject } => {
  if (cachedKeyPair) return cachedKeyPair;

  const envPrivateKey = process.env.MOCK_JWKS_PRIVATE_KEY;

  if (envPrivateKey) {
    const privateKey = crypto.createPrivateKey(envPrivateKey);
    const publicKey = crypto.createPublicKey(privateKey);
    cachedKeyPair = { publicKey, privateKey };
  } else {
    const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
    });
    cachedKeyPair = { publicKey, privateKey };
  }

  return cachedKeyPair;
};

const KID = "mock-key-1";

export const handleJwks = async (
  _event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  const { publicKey } = getKeyPair();

  const jwk = publicKey.export({ format: "jwk" });

  return jsonResponse(
    200,
    {
      keys: [
        {
          ...jwk,
          kid: KID,
          use: "sig",
          alg: "RS256",
        },
      ],
    },
    { "Cache-Control": "public, max-age=3600" },
  );
};

/**
 * Utility: sign a JWT payload using the mock private key.
 * Used by tests or companion scripts to generate valid tokens.
 */
export const signMockJwt = (payload: Record<string, unknown>): string => {
  const { privateKey } = getKeyPair();

  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT", kid: KID })).toString(
    "base64url",
  );
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.sign("sha256", Buffer.from(`${header}.${body}`), privateKey);

  return `${header}.${body}.${signature.toString("base64url")}`;
};
