import { AuthTokenService } from "./auth-token-service";

const mockSign = jest.fn();
const mockCleanupKey = jest.fn();

jest.mock("jsonwebtoken", () => ({
  __esModule: true,
  default: {
    sign: mockSign,
  },
}));

jest.mock("./auth-utils", () => ({
  cleanupKey: mockCleanupKey,
}));

describe("AuthTokenService", () => {
  const authConfig = {
    keyId: "test-key-id",
    sessionMaxDurationMinutes: 180,
    accessTokenExpiryDurationMinutes: 15,
    refreshTokenExpiryDurationMinutes: 60,
    privateKeys: {
      key: "raw-private-key",
    },
    publicKeys: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSign.mockReturnValue("signed-token");
    mockCleanupKey.mockReturnValue("clean-private-key");
  });

  it("generates auth access token with expected claims, key, and options", () => {
    const service = new AuthTokenService(authConfig);
    const accessTokenPayload = {
      sessionId: "session-123",
      sessionStartTime: 1700000000,
    };

    const token = service.generateAuthAccessToken(accessTokenPayload);

    expect(mockCleanupKey).toHaveBeenCalledWith("raw-private-key");
    expect(mockSign).toHaveBeenCalledWith(accessTokenPayload, "clean-private-key", {
      expiresIn: "15m",
      algorithm: "RS512",
      header: {
        alg: "RS512",
        kid: "test-key-id",
      },
    });
    expect(token).toBe("signed-token");
  });

  it("generates auth refresh token with expected claims, key, and options", () => {
    const service = new AuthTokenService(authConfig);
    const refreshTokenPayload = {
      refreshToken: "refresh-token-123",
    };

    const token = service.generateAuthRefreshToken(refreshTokenPayload);

    expect(mockCleanupKey).toHaveBeenCalledWith("raw-private-key");
    expect(mockSign).toHaveBeenCalledWith(refreshTokenPayload, "clean-private-key", {
      expiresIn: "60m",
      algorithm: "RS512",
      header: {
        alg: "RS512",
        kid: "test-key-id",
      },
    });
    expect(token).toBe("signed-token");
  });

  it("falls back to empty key when cleanupKey returns undefined", () => {
    const service = new AuthTokenService(authConfig);
    mockCleanupKey.mockReturnValue(undefined);

    service.generateAuthAccessToken({
      sessionId: "session-456",
      sessionStartTime: 1700000100,
    });

    expect(mockSign).toHaveBeenCalledWith(
      {
        sessionId: "session-456",
        sessionStartTime: 1700000100,
      },
      "",
      expect.objectContaining({
        expiresIn: "15m",
      }),
    );
  });

  it("falls back to empty key for refresh token when cleanupKey returns undefined", () => {
    const service = new AuthTokenService(authConfig);
    mockCleanupKey.mockReturnValue(undefined);

    service.generateAuthRefreshToken({
      refreshToken: "refresh-token-789",
    });

    expect(mockSign).toHaveBeenCalledWith(
      {
        refreshToken: "refresh-token-789",
      },
      "",
      expect.objectContaining({
        expiresIn: "60m",
      }),
    );
  });
});
