const authTokenServiceMockSign = jest.fn();
const authTokenServiceMockCleanupKey = jest.fn();

jest.mock("jsonwebtoken", () => ({
  __esModule: true,
  default: {
    sign: authTokenServiceMockSign,
  },
}));

jest.mock("./auth-utils", () => ({
  cleanupKey: authTokenServiceMockCleanupKey,
}));

const { AuthTokenService } =
  jest.requireActual<typeof import("./auth-token-service")>("./auth-token-service");

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
    authTokenServiceMockSign.mockReturnValue("signed-token");
    authTokenServiceMockCleanupKey.mockReturnValue("clean-private-key");
  });

  it("generates auth access token with expected claims, key, and options", () => {
    const service = new AuthTokenService(authConfig);
    const accessTokenPayload = {
      sessionId: "session-123",
      sessionStartTime: 1700000000,
    };

    const token = service.generateAuthAccessToken(accessTokenPayload);

    expect(authTokenServiceMockCleanupKey).toHaveBeenCalledWith("raw-private-key");
    expect(authTokenServiceMockSign).toHaveBeenCalledWith(accessTokenPayload, "clean-private-key", {
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

    expect(authTokenServiceMockCleanupKey).toHaveBeenCalledWith("raw-private-key");
    expect(authTokenServiceMockSign).toHaveBeenCalledWith(
      refreshTokenPayload,
      "clean-private-key",
      {
        expiresIn: "60m",
        algorithm: "RS512",
        header: {
          alg: "RS512",
          kid: "test-key-id",
        },
      },
    );
    expect(token).toBe("signed-token");
  });

  it("falls back to empty key when cleanupKey returns undefined", () => {
    const service = new AuthTokenService(authConfig);
    authTokenServiceMockCleanupKey.mockReturnValue(undefined);

    service.generateAuthAccessToken({
      sessionId: "session-456",
      sessionStartTime: 1700000100,
    });

    expect(authTokenServiceMockSign).toHaveBeenCalledWith(
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
    authTokenServiceMockCleanupKey.mockReturnValue(undefined);

    service.generateAuthRefreshToken({
      refreshToken: "refresh-token-789",
    });

    expect(authTokenServiceMockSign).toHaveBeenCalledWith(
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
