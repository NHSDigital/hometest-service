const sessionTokenServiceMockSign = jest.fn();
const sessionTokenServiceMockCleanupKey = jest.fn();

jest.mock("jsonwebtoken", () => ({
  __esModule: true,
  default: {
    sign: sessionTokenServiceMockSign,
  },
}));

jest.mock("./auth-utils", () => ({
  cleanupKey: sessionTokenServiceMockCleanupKey,
}));

const { SessionTokenService } =
  jest.requireActual<typeof import("./session-token-service")>("./session-token-service");

describe("SessionTokenService", () => {
  const config = {
    privateKey: "raw-private-key",
    accessTokenExpiryDurationMinutes: 10,
    refreshTokenExpiryDurationMinutes: 60,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    sessionTokenServiceMockSign.mockReturnValue("signed-token");
    sessionTokenServiceMockCleanupKey.mockReturnValue("clean-private-key");
  });

  describe("signAccessToken", () => {
    it("signs with the correct payload, key, and options", () => {
      const service = new SessionTokenService(config);
      const payload = {
        sessionId: "abc-123",
        sessionCreatedAt: "2026-04-14T10:00:00.000Z",
      };

      const token = service.signAccessToken(payload);

      expect(sessionTokenServiceMockCleanupKey).toHaveBeenCalledWith("raw-private-key");
      expect(sessionTokenServiceMockSign).toHaveBeenCalledWith(payload, "clean-private-key", {
        expiresIn: "10m",
        algorithm: "RS512",
      });
      expect(token).toBe("signed-token");
    });
  });

  describe("signRefreshToken", () => {
    it("signs with the correct payload, key, and options", () => {
      const service = new SessionTokenService(config);
      const payload = { refreshTokenId: "def-456" };

      const token = service.signRefreshToken(payload);

      expect(sessionTokenServiceMockCleanupKey).toHaveBeenCalledWith("raw-private-key");
      expect(sessionTokenServiceMockSign).toHaveBeenCalledWith(payload, "clean-private-key", {
        expiresIn: "60m",
        algorithm: "RS512",
      });
      expect(token).toBe("signed-token");
    });
  });

  it("throws during construction if privateKey is empty", () => {
    expect(() => new SessionTokenService({ ...config, privateKey: "" })).toThrow(
      "SessionTokenService requires a non-empty private key",
    );
  });
});
