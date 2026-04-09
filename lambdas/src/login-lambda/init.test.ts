const mockRetrieveMandatoryEnvVariable = jest.fn();
const mockRetrieveOptionalEnvVariableWithDefault = jest.fn();
const mockGetSecretValue = jest.fn();

const mockAuthTokenServiceInstance = {
  generateAuthAccessToken: jest.fn(),
  generateAuthRefreshToken: jest.fn(),
};

const mockNhsLoginJwtHelperInstance = {};
const mockHttpClientInstance = {};
const mockJwksClientInstance = {};
const mockNhsLoginClientInstance = {};
const mockTokenServiceInstance = {};
const mockLoginServiceInstance = {
  performLogin: jest.fn(),
};

jest.mock("../lib/utils/utils", () => ({
  retrieveMandatoryEnvVariable: (...args: unknown[]) => mockRetrieveMandatoryEnvVariable(...args),
  retrieveOptionalEnvVariableWithDefault: (...args: unknown[]) =>
    mockRetrieveOptionalEnvVariableWithDefault(...args),
}));

jest.mock("../lib/secrets/secrets-manager-client", () => ({
  AwsSecretsClient: jest.fn().mockImplementation(() => ({
    getSecretValue: mockGetSecretValue,
  })),
}));

jest.mock("../lib/auth/auth-token-service", () => ({
  AuthTokenService: jest.fn().mockImplementation(() => mockAuthTokenServiceInstance),
}));

jest.mock("../lib/login/nhs-login-jwt-helper", () => ({
  NhsLoginJwtHelper: jest.fn().mockImplementation(() => mockNhsLoginJwtHelperInstance),
}));

jest.mock("../lib/http/login-http-client", () => ({
  HttpClient: jest.fn().mockImplementation(() => mockHttpClientInstance),
}));

jest.mock("jwks-rsa", () => ({
  JwksClient: jest.fn().mockImplementation(() => mockJwksClientInstance),
}));

jest.mock("../lib/login/nhs-login-client", () => ({
  NhsLoginClient: jest.fn().mockImplementation(() => mockNhsLoginClientInstance),
}));

jest.mock("../lib/login/token-service", () => ({
  TokenService: jest.fn().mockImplementation(() => mockTokenServiceInstance),
}));

jest.mock("./login-service", () => ({
  LoginService: jest.fn().mockImplementation(() => mockLoginServiceInstance),
}));

describe("login-lambda init", () => {
  const baseEnvValues: Record<string, string> = {
    NHS_LOGIN_BASE_ENDPOINT_URL: "https://nhs-login.example",
    NHS_LOGIN_CLIENT_ID: "client-id-123",
    NHS_LOGIN_REDIRECT_URL: "https://app.example/callback",
    NHS_LOGIN_PRIVATE_KEY_SECRET_NAME: "nhs-login-private-key-secret",
    AUTH_SESSION_MAX_DURATION_MINUTES: "120",
    AUTH_ACCESS_TOKEN_EXPIRY_DURATION_MINUTES: "10",
    AUTH_REFRESH_TOKEN_EXPIRY_DURATION_MINUTES: "30",
    AUTH_COOKIE_SAME_SITE: "Strict",
    AWS_REGION: "eu-west-2",
  };

  function setMandatoryEnvVariableMock(overrides: Record<string, string> = {}): void {
    const values = { ...baseEnvValues, ...overrides };

    mockRetrieveMandatoryEnvVariable.mockImplementation((key: string) => {
      const value = values[key];
      if (!value) {
        throw new Error(`Missing environment variable: ${key}`);
      }
      return value;
    });

    mockRetrieveOptionalEnvVariableWithDefault.mockImplementation(
      (_key: string, defaultVal: string) => defaultVal,
    );
  }

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    setMandatoryEnvVariableMock();
    mockGetSecretValue.mockResolvedValue("nhs-private-key");
  });

  it("initializes and wires all dependencies with expected configuration", async () => {
    const { buildEnvironment: init } = await import("./init");
    const result = await init();

    const { AwsSecretsClient } = await import("../lib/secrets/secrets-manager-client");
    const { AuthTokenService } = await import("../lib/auth/auth-token-service");
    const { NhsLoginJwtHelper } = await import("../lib/login/nhs-login-jwt-helper");
    const { HttpClient } = await import("../lib/http/login-http-client");
    const { JwksClient } = await import("jwks-rsa");
    const { NhsLoginClient } = await import("../lib/login/nhs-login-client");
    const { TokenService } = await import("../lib/login/token-service");
    const { LoginService } = await import("./login-service");

    expect(AwsSecretsClient).toHaveBeenCalledWith("eu-west-2");
    expect(mockGetSecretValue).toHaveBeenCalledWith("nhs-login-private-key-secret");

    expect(AuthTokenService).toHaveBeenCalledWith({
      sessionMaxDurationMinutes: 120,
      accessTokenExpiryDurationMinutes: 10,
      refreshTokenExpiryDurationMinutes: 30,
      privateKeys: { key: "nhs-private-key" },
      publicKeys: {},
    });

    const expectedNhsConfig = {
      clientId: "client-id-123",
      expiresIn: 60,
      redirectUri: "https://app.example/callback",
      baseUri: "https://nhs-login.example",
      privateKey: "nhs-private-key",
    };

    expect(NhsLoginJwtHelper).toHaveBeenCalledWith(expectedNhsConfig);
    expect(HttpClient).toHaveBeenCalledTimes(1);
    expect(JwksClient).toHaveBeenCalledWith({
      cache: true,
      rateLimit: true,
      jwksUri: "https://nhs-login.example/.well-known/jwks.json",
    });
    expect(NhsLoginClient).toHaveBeenCalledWith(
      expectedNhsConfig,
      mockNhsLoginJwtHelperInstance,
      mockHttpClientInstance,
      mockJwksClientInstance,
    );
    expect(TokenService).toHaveBeenCalledWith(mockNhsLoginClientInstance, expectedNhsConfig);
    expect(LoginService).toHaveBeenCalledWith({
      tokenService: mockTokenServiceInstance,
      nhsLoginClient: mockNhsLoginClientInstance,
      sessionMaxDurationMinutes: 120,
    });

    expect(result).toEqual({
      loginService: mockLoginServiceInstance,
      authTokenService: mockAuthTokenServiceInstance,
      authCookieSameSite: "Strict",
      authCookieSecure: true,
    });
  });

  it("uses the AWS_REGION value from mandatory env variable", async () => {
    setMandatoryEnvVariableMock({ AWS_REGION: "eu-central-1" });

    const { buildEnvironment: init } = await import("./init");
    await init();

    const { AwsSecretsClient } = await import("../lib/secrets/secrets-manager-client");
    expect(AwsSecretsClient).toHaveBeenCalledWith("eu-central-1");
  });

  it("throws when AWS_REGION is missing", async () => {
    setMandatoryEnvVariableMock({ AWS_REGION: "" });

    const { buildEnvironment: init } = await import("./init");
    await expect(init()).rejects.toThrow("Missing environment variable: AWS_REGION");
  });

  describe("singleton protection", () => {
    it("should only construct dependencies once no matter how many times init() is called", async () => {
      const { init: singletonInit } = await import("./init");

      const promise1 = singletonInit();
      const promise2 = singletonInit();

      const { AwsSecretsClient } = await import("../lib/secrets/secrets-manager-client");
      expect(AwsSecretsClient).toHaveBeenCalledTimes(1);
      expect(promise1).toBe(promise2);
    });
  });

  describe("rejection retry", () => {
    it("should clear the cached environment on rejection so subsequent calls can retry", async () => {
      mockGetSecretValue
        .mockRejectedValueOnce(new Error("Secrets Manager unavailable"))
        .mockResolvedValue("nhs-private-key");

      const { init: singletonInit } = await import("./init");

      await expect(singletonInit()).rejects.toThrow("Secrets Manager unavailable");

      // Second call should retry — not return the cached rejected Promise
      const result = await singletonInit();
      expect(result).toHaveProperty("loginService");
      expect(result).toHaveProperty("authTokenService");
    });
  });
});
