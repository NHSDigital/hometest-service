import type { buildEnvironment } from "./init";

// Keep the file as a TS module; runtime imports must stay inside tests because
// jest.resetModules() relies on fresh imports of "./init".
export type BuildEnvironmentFn = typeof buildEnvironment;

const mockRetrieveMandatoryEnvVariable = jest.fn();
const mockRetrieveOptionalEnvVariable = jest.fn();
const mockGetSecretValue = jest.fn();

const mockAuthTokenVerifierInstance = { verifyToken: jest.fn() };
const mockNhsLoginClientInstance = { getUserInfo: jest.fn() };

jest.mock("../lib/utils/utils", () => ({
  retrieveMandatoryEnvVariable: (...args: unknown[]) => mockRetrieveMandatoryEnvVariable(...args),
  retrieveOptionalEnvVariable: (...args: unknown[]) => mockRetrieveOptionalEnvVariable(...args),
}));

jest.mock("../lib/secrets/secrets-manager-client", () => ({
  AwsSecretsClient: jest.fn().mockImplementation(() => ({
    getSecretValue: mockGetSecretValue,
  })),
}));

jest.mock("../lib/auth/auth-token-verifier", () => ({
  AuthTokenVerifier: jest.fn().mockImplementation(() => mockAuthTokenVerifierInstance),
}));

jest.mock("../lib/login/nhs-login-client", () => ({
  NhsLoginClient: jest.fn().mockImplementation(() => mockNhsLoginClientInstance),
}));

jest.mock("../lib/http/login-http-client", () => ({
  HttpClient: jest.fn().mockImplementation(() => ({})),
}));

jest.mock("jwks-rsa", () => ({
  JwksClient: jest.fn().mockImplementation(() => ({})),
}));

describe("session-lambda init", () => {
  const baseEnvValues: Record<string, string> = {
    AUTH_COOKIE_PUBLIC_KEY_SECRET_NAME: "auth-cookie-public-key-secret",
    NHS_LOGIN_BASE_ENDPOINT_URL: "https://nhs-login.example",
  };

  function setEnvVariableMocks(overrides: Record<string, string> = {}): void {
    const values = { ...baseEnvValues, ...overrides };

    mockRetrieveMandatoryEnvVariable.mockImplementation((key: string) => {
      const value = values[key];
      if (!value) throw new Error(`Missing environment variable: ${key}`);
      return value;
    });

    mockRetrieveOptionalEnvVariable.mockImplementation((_key: string, defaultVal: string = "") => {
      return defaultVal;
    });
  }

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    process.env.AWS_REGION = "eu-west-2";
    delete process.env.AWS_DEFAULT_REGION;

    setEnvVariableMocks();
    mockGetSecretValue.mockResolvedValue("test-public-key");
  });

  it("initializes and wires all dependencies with expected configuration", async () => {
    const { buildEnvironment: init } = await import("./init");
    const result = await init();

    const { AwsSecretsClient } = await import("../lib/secrets/secrets-manager-client");
    const { AuthTokenVerifier } = await import("../lib/auth/auth-token-verifier");
    const { NhsLoginClient } = await import("../lib/login/nhs-login-client");

    expect(AwsSecretsClient).toHaveBeenCalledWith("eu-west-2");
    expect(mockGetSecretValue).toHaveBeenCalledWith("auth-cookie-public-key-secret");
    expect(AuthTokenVerifier).toHaveBeenCalledWith({
      keyId: "key",
      publicKeys: { key: "test-public-key" },
    });
    expect(NhsLoginClient).toHaveBeenCalledTimes(1);

    expect(result).toEqual({
      authTokenVerifier: mockAuthTokenVerifierInstance,
      nhsLoginClient: mockNhsLoginClientInstance,
    });
  });

  it("uses AWS_REGION when set", async () => {
    process.env.AWS_REGION = "eu-central-1";

    const { buildEnvironment: init } = await import("./init");
    await init();

    const { AwsSecretsClient } = await import("../lib/secrets/secrets-manager-client");
    expect(AwsSecretsClient).toHaveBeenCalledWith("eu-central-1");
  });

  it("uses AWS_DEFAULT_REGION when AWS_REGION is not set", async () => {
    delete process.env.AWS_REGION;
    process.env.AWS_DEFAULT_REGION = "ap-southeast-2";

    const { buildEnvironment: init } = await import("./init");
    await init();

    const { AwsSecretsClient } = await import("../lib/secrets/secrets-manager-client");
    expect(AwsSecretsClient).toHaveBeenCalledWith("ap-southeast-2");
  });

  it("falls back to eu-west-2 when no AWS region env vars are set", async () => {
    delete process.env.AWS_REGION;
    delete process.env.AWS_DEFAULT_REGION;

    const { buildEnvironment: init } = await import("./init");
    await init();

    const { AwsSecretsClient } = await import("../lib/secrets/secrets-manager-client");
    expect(AwsSecretsClient).toHaveBeenCalledWith("eu-west-2");
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
        .mockResolvedValue("test-public-key");

      const { init: singletonInit } = await import("./init");

      await expect(singletonInit()).rejects.toThrow("Secrets Manager unavailable");

      // Second call should retry — not return the cached rejected Promise
      const result = await singletonInit();
      expect(result).toHaveProperty("authTokenVerifier");
      expect(result).toHaveProperty("nhsLoginClient");
    });
  });
});
