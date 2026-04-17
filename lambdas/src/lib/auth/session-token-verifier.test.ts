import { JsonWebTokenError, TokenExpiredError, type VerifyOptions } from "jsonwebtoken";

import { SessionTokenVerifier } from "./session-token-verifier";

const mockCleanupKey = jest.fn();

jest.mock("jsonwebtoken", () => ({
  __esModule: true,
  JsonWebTokenError: class JsonWebTokenError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "JsonWebTokenError";
    }
  },
  TokenExpiredError: class TokenExpiredError extends Error {
    expiredAt: Date;

    constructor(message: string, expiredAt: Date) {
      super(message);
      this.name = "TokenExpiredError";
      this.expiredAt = expiredAt;
    }
  },
  decode: jest.fn(),
  verify: jest.fn(),
  default: {
    decode: jest.fn(),
    verify: jest.fn(),
  },
}));

jest.mock("./auth-utils", () => ({
  cleanupKey: (key: string) => mockCleanupKey(key),
}));

const mockJwtModule = jest.requireMock("jsonwebtoken") as {
  default: {
    decode: jest.Mock;
    verify: jest.Mock;
  };
};

const mockDecode = mockJwtModule.default.decode;
const mockVerify = mockJwtModule.default.verify;

describe("SessionTokenVerifier", () => {
  const verifierConfig = {
    keyId: "default-key-id",
    publicKeys: {
      "decoded-kid": "raw-public-key-from-decoded-kid",
      "default-key-id": "raw-public-key-from-default-kid",
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCleanupKey.mockReturnValue("clean-public-key");
  });

  it("verifies an access token and returns verified claims", async () => {
    const verifier = new SessionTokenVerifier(verifierConfig);
    mockDecode.mockReturnValue({
      header: {
        alg: "RS512",
        kid: "decoded-kid",
      },
      payload: {},
      signature: "signature",
    });
    mockVerify.mockReturnValue({
      sessionId: "session-123",
      sessionCreatedAt: "2026-04-17T09:00:00.000Z",
      exp: 1,
      iat: 1,
    });

    const result = await verifier.verifyAccessToken("encoded-token");

    expect(mockCleanupKey).toHaveBeenCalledWith("raw-public-key-from-decoded-kid");
    expect(mockVerify).toHaveBeenCalledWith("encoded-token", "clean-public-key", {
      algorithms: ["RS512"],
    });
    expect(result).toEqual({
      success: true,
      header: {
        alg: "RS512",
        kid: "decoded-kid",
      },
      payload: {
        sessionId: "session-123",
        sessionCreatedAt: "2026-04-17T09:00:00.000Z",
        exp: 1,
        iat: 1,
      },
    });
  });

  it("supports ignoreExpiration for refresh-flow access token checks", async () => {
    const verifier = new SessionTokenVerifier(verifierConfig);
    mockDecode.mockReturnValue({
      header: {
        alg: "RS512",
      },
      payload: {},
      signature: "signature",
    });
    mockVerify.mockReturnValue({
      sessionId: "session-123",
      sessionCreatedAt: "2026-04-17T09:00:00.000Z",
    });

    await verifier.verifyAccessToken("encoded-token", {
      ignoreExpiration: true,
    } satisfies VerifyOptions);

    expect(mockVerify).toHaveBeenCalledWith("encoded-token", "clean-public-key", {
      algorithms: ["RS512"],
      ignoreExpiration: true,
    });
  });

  it("falls back to the configured keyId when the token does not include kid", async () => {
    const verifier = new SessionTokenVerifier(verifierConfig);
    mockDecode.mockReturnValue({
      header: {
        alg: "RS512",
      },
      payload: {},
      signature: "signature",
    });
    mockVerify.mockReturnValue({
      refreshTokenId: "refresh-token-123",
    });

    const result = await verifier.verifyRefreshToken("encoded-token");

    expect(mockCleanupKey).toHaveBeenCalledWith("raw-public-key-from-default-kid");
    expect(result).toEqual({
      success: true,
      header: {
        alg: "RS512",
      },
      payload: {
        refreshTokenId: "refresh-token-123",
      },
    });
  });

  it("uses the only configured key when no kid or default keyId is provided", async () => {
    const verifier = new SessionTokenVerifier({
      publicKeys: {
        "only-key": "raw-public-key",
      },
    });
    mockDecode.mockReturnValue({
      header: {
        alg: "RS512",
      },
      payload: {},
      signature: "signature",
    });
    mockVerify.mockReturnValue({
      sessionId: "session-123",
      sessionCreatedAt: "2026-04-17T09:00:00.000Z",
    });

    const result = await verifier.verifyAccessToken("encoded-token");

    expect(mockCleanupKey).toHaveBeenCalledWith("raw-public-key");
    expect(result).toEqual({
      success: true,
      header: {
        alg: "RS512",
      },
      payload: {
        sessionId: "session-123",
        sessionCreatedAt: "2026-04-17T09:00:00.000Z",
      },
    });
  });

  it("returns UNKNOWN_KEY when no matching verification key is available", async () => {
    const verifier = new SessionTokenVerifier({
      publicKeys: {
        "first-key": "raw-public-key-1",
        "second-key": "raw-public-key-2",
      },
    });
    mockDecode.mockReturnValue({
      header: {
        alg: "RS512",
      },
      payload: {},
      signature: "signature",
    });

    const result = await verifier.verifyAccessToken("encoded-token");

    expect(mockVerify).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      error: {
        code: "UNKNOWN_KEY",
        message: "No public key is configured for the token",
      },
    });
  });

  it("returns TOKEN_EXPIRED for expired tokens", async () => {
    const verifier = new SessionTokenVerifier(verifierConfig);
    mockDecode.mockReturnValue({
      header: {
        alg: "RS512",
        kid: "decoded-kid",
      },
      payload: {},
      signature: "signature",
    });
    mockVerify.mockImplementation(() => {
      throw new TokenExpiredError("jwt expired", new Date());
    });

    const result = await verifier.verifyAccessToken("encoded-token");

    expect(result).toEqual({
      success: false,
      error: {
        code: "TOKEN_EXPIRED",
        message: "jwt expired",
      },
    });
  });

  it("returns INVALID_SIGNATURE for invalid signatures", async () => {
    const verifier = new SessionTokenVerifier(verifierConfig);
    mockDecode.mockReturnValue({
      header: {
        alg: "RS512",
        kid: "decoded-kid",
      },
      payload: {},
      signature: "signature",
    });
    mockVerify.mockImplementation(() => {
      throw new JsonWebTokenError("invalid signature");
    });

    const result = await verifier.verifyAccessToken("encoded-token");

    expect(result).toEqual({
      success: false,
      error: {
        code: "INVALID_SIGNATURE",
        message: "invalid signature",
      },
    });
  });

  it("returns MALFORMED_TOKEN for malformed tokens", async () => {
    const verifier = new SessionTokenVerifier(verifierConfig);
    mockDecode.mockReturnValue(null);

    const result = await verifier.verifyAccessToken("encoded-token");

    expect(mockVerify).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      error: {
        code: "MALFORMED_TOKEN",
        message: "Token is malformed",
      },
    });
  });
});
