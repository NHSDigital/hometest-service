import { generateKeyPairSync } from "node:crypto";

import jwt, { type SignOptions } from "jsonwebtoken";

import { SessionTokenVerifier } from "./session-token-verifier";

interface RsaKeyPair {
  privateKey: string;
  publicKey: string;
}

function createRsaKeyPair(): RsaKeyPair {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    privateKeyEncoding: {
      format: "pem",
      type: "pkcs8",
    },
    publicKeyEncoding: {
      format: "pem",
      type: "spki",
    },
  });

  return { privateKey, publicKey };
}

function compactPem(pem: string): string {
  return pem.replaceAll("\r", "").replaceAll("\n", "");
}

function signToken(
  payload: Record<string, string>,
  privateKey: string,
  options?: Omit<SignOptions, "algorithm">,
): string {
  return jwt.sign(payload, privateKey, {
    algorithm: "RS512",
    ...options,
  });
}

function signRs256Token(
  payload: Record<string, string>,
  privateKey: string,
  options?: Omit<SignOptions, "algorithm">,
): string {
  return jwt.sign(payload, privateKey, {
    algorithm: "RS256",
    ...options,
  });
}

describe("SessionTokenVerifier", () => {
  const primaryKeys = createRsaKeyPair();
  const secondaryKeys = createRsaKeyPair();

  const verifierConfig = {
    keyId: "default-key-id",
    publicKeys: {
      "decoded-kid": compactPem(primaryKeys.publicKey),
      "default-key-id": compactPem(secondaryKeys.publicKey),
    },
  };

  it("verifies an access token and returns verified claims", async () => {
    const verifier = new SessionTokenVerifier(verifierConfig);
    const token = signToken(
      {
        sessionId: "session-123",
        sessionCreatedAt: "2026-04-17T09:00:00.000Z",
      },
      primaryKeys.privateKey,
      {
        expiresIn: "1h",
        header: {
          alg: "RS512",
          kid: "decoded-kid",
        },
      },
    );

    const result = await verifier.verifyAccessToken(token);

    expect(result.success).toBe(true);
    if (!result.success) {
      throw new Error("Expected successful verification result");
    }

    expect(result.header).toEqual(
      expect.objectContaining({
        alg: "RS512",
        kid: "decoded-kid",
      }),
    );
    expect(result.payload).toEqual(
      expect.objectContaining({
        sessionId: "session-123",
        sessionCreatedAt: "2026-04-17T09:00:00.000Z",
      }),
    );
    expect(result.payload.exp).toEqual(expect.any(Number));
    expect(result.payload.iat).toEqual(expect.any(Number));
  });

  it("supports ignoreExpiration for refresh-flow access token checks", async () => {
    const verifier = new SessionTokenVerifier({
      publicKeys: {
        "only-key": compactPem(primaryKeys.publicKey),
      },
    });
    const expiredToken = signToken(
      {
        sessionId: "session-123",
        sessionCreatedAt: "2026-04-17T09:00:00.000Z",
      },
      primaryKeys.privateKey,
      {
        expiresIn: "-10s",
      },
    );

    const result = await verifier.verifyAccessToken(expiredToken, {
      ignoreExpiration: true,
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      throw new Error("Expected ignoreExpiration to allow verification to succeed");
    }

    expect(result.payload).toEqual(
      expect.objectContaining({
        sessionId: "session-123",
        sessionCreatedAt: "2026-04-17T09:00:00.000Z",
      }),
    );
  });

  it("falls back to the configured keyId when the token does not include kid", async () => {
    const verifier = new SessionTokenVerifier({
      keyId: "default-key-id",
      publicKeys: {
        "default-key-id": compactPem(primaryKeys.publicKey),
      },
    });
    const token = signToken(
      {
        refreshTokenId: "refresh-token-123",
      },
      primaryKeys.privateKey,
    );

    const result = await verifier.verifyRefreshToken(token);

    expect(result.success).toBe(true);
    if (!result.success) {
      throw new Error("Expected configured keyId fallback to verify the token");
    }

    expect(result.header).toEqual(
      expect.objectContaining({
        alg: "RS512",
      }),
    );
    expect(result.payload).toEqual(
      expect.objectContaining({
        refreshTokenId: "refresh-token-123",
      }),
    );
  });

  it("uses the only configured key when no kid or default keyId is provided", async () => {
    const verifier = new SessionTokenVerifier({
      publicKeys: {
        "only-key": compactPem(primaryKeys.publicKey),
      },
    });
    const token = signToken(
      {
        sessionId: "session-123",
        sessionCreatedAt: "2026-04-17T09:00:00.000Z",
      },
      primaryKeys.privateKey,
    );

    const result = await verifier.verifyAccessToken(token);

    expect(result.success).toBe(true);
    if (!result.success) {
      throw new Error("Expected single configured key fallback to verify the token");
    }

    expect(result.payload).toEqual(
      expect.objectContaining({
        sessionId: "session-123",
        sessionCreatedAt: "2026-04-17T09:00:00.000Z",
      }),
    );
  });

  it("returns UNKNOWN_KEY when no matching verification key is available", async () => {
    const verifier = new SessionTokenVerifier({
      publicKeys: {
        "first-key": compactPem(primaryKeys.publicKey),
        "second-key": compactPem(secondaryKeys.publicKey),
      },
    });
    const token = signToken(
      {
        sessionId: "session-123",
        sessionCreatedAt: "2026-04-17T09:00:00.000Z",
      },
      primaryKeys.privateKey,
    );

    const result = await verifier.verifyAccessToken(token);

    expect(result).toEqual({
      success: false,
      error: {
        code: "UNKNOWN_KEY",
        message: "No public key is configured for the token",
      },
    });
  });

  it("returns TOKEN_EXPIRED for expired tokens", async () => {
    const verifier = new SessionTokenVerifier({
      publicKeys: {
        "only-key": compactPem(primaryKeys.publicKey),
      },
    });
    const expiredToken = signToken(
      {
        sessionId: "session-123",
        sessionCreatedAt: "2026-04-17T09:00:00.000Z",
      },
      primaryKeys.privateKey,
      {
        expiresIn: "-10s",
      },
    );

    const result = await verifier.verifyAccessToken(expiredToken);

    expect(result).toEqual({
      success: false,
      error: {
        code: "TOKEN_EXPIRED",
        message: "Token has expired",
      },
    });
  });

  it("returns INVALID_SIGNATURE for invalid signatures", async () => {
    const verifier = new SessionTokenVerifier({
      publicKeys: {
        "decoded-kid": compactPem(primaryKeys.publicKey),
      },
    });
    const token = signToken(
      {
        sessionId: "session-123",
        sessionCreatedAt: "2026-04-17T09:00:00.000Z",
      },
      secondaryKeys.privateKey,
      {
        header: {
          alg: "RS512",
          kid: "decoded-kid",
        },
      },
    );

    const result = await verifier.verifyAccessToken(token);

    expect(result).toEqual({
      success: false,
      error: {
        code: "INVALID_SIGNATURE",
        message: "Token signature is invalid",
      },
    });
  });

  it("returns INVALID_ALGORITHM for tokens signed with a different algorithm", async () => {
    const verifier = new SessionTokenVerifier({
      publicKeys: {
        "decoded-kid": compactPem(primaryKeys.publicKey),
      },
    });
    const token = signRs256Token(
      {
        sessionId: "session-123",
        sessionCreatedAt: "2026-04-17T09:00:00.000Z",
      },
      primaryKeys.privateKey,
      {
        header: {
          alg: "RS256",
          kid: "decoded-kid",
        },
      },
    );

    const result = await verifier.verifyAccessToken(token, {
      algorithms: ["RS256"],
    });

    expect(result).toEqual({
      success: false,
      error: {
        code: "INVALID_ALGORITHM",
        message: "Token uses an invalid algorithm",
      },
    });
  });

  it("returns MALFORMED_TOKEN for malformed tokens", async () => {
    const verifier = new SessionTokenVerifier(verifierConfig);

    const result = await verifier.verifyAccessToken("not-a-jwt");

    expect(result).toEqual({
      success: false,
      error: {
        code: "MALFORMED_TOKEN",
        message: "Token is malformed",
      },
    });
  });
});
