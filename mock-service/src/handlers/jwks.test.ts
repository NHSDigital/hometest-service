import { handleJwks, signMockJwt } from "./jwks";
import { mockEvent } from "../test-utils/mock-event";
import * as crypto from "crypto";

describe("handleJwks", () => {
  it("returns a JWKS with one RSA key", async () => {
    const result = await handleJwks(mockEvent({ httpMethod: "GET", path: "/mock/cognito/.well-known/jwks.json" }));

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.keys).toHaveLength(1);

    const key = body.keys[0];
    expect(key.kty).toBe("RSA");
    expect(key.use).toBe("sig");
    expect(key.alg).toBe("RS256");
    expect(key.kid).toBe("mock-key-1");
    expect(key.n).toBeTruthy();
    expect(key.e).toBeTruthy();
  });

  it("returns a Cache-Control header", async () => {
    const result = await handleJwks(mockEvent({ httpMethod: "GET", path: "/mock/cognito/.well-known/jwks.json" }));
    expect(result.headers?.["Cache-Control"]).toBe("public, max-age=3600");
  });
});

describe("signMockJwt", () => {
  it("produces a JWT that can be verified against the JWKS public key", async () => {
    const payload = { sub: "test-user", iss: "mock-cognito", aud: "hometest", exp: Math.floor(Date.now() / 1000) + 3600 };
    const token = signMockJwt(payload);

    // Parse the JWT
    const [headerB64, payloadB64, signatureB64] = token.split(".");
    const header = JSON.parse(Buffer.from(headerB64, "base64url").toString());
    const decoded = JSON.parse(Buffer.from(payloadB64, "base64url").toString());

    expect(header.alg).toBe("RS256");
    expect(header.kid).toBe("mock-key-1");
    expect(decoded.sub).toBe("test-user");

    // Verify the signature using the JWKS public key
    const jwksResult = await handleJwks(mockEvent({ httpMethod: "GET", path: "/mock/cognito/.well-known/jwks.json" }));
    const jwks = JSON.parse(jwksResult.body);
    const publicKey = crypto.createPublicKey({ key: jwks.keys[0], format: "jwk" });

    const isValid = crypto.verify(
      "sha256",
      Buffer.from(`${headerB64}.${payloadB64}`),
      publicKey,
      Buffer.from(signatureB64, "base64url"),
    );

    expect(isValid).toBe(true);
  });
});
