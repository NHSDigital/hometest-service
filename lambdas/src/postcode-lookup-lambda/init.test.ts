import type { buildEnvironment } from "./init";

// Keep the file as a TS module; runtime imports must stay inside tests because
// jest.resetModules() relies on fresh imports of "./init".
export type BuildEnvironmentFn = typeof buildEnvironment;

const mockRetrieveMandatoryEnvVariable = jest.fn();
const mockRetrieveOptionalEnvVariable = jest.fn();
const mockGetSecretValue = jest.fn();

const mockPostcodeLookupServiceInstance = { performLookup: jest.fn() };

jest.mock("../lib/utils/utils", () => ({
  retrieveMandatoryEnvVariable: (...args: unknown[]) => mockRetrieveMandatoryEnvVariable(...args),
  retrieveOptionalEnvVariable: (...args: unknown[]) => mockRetrieveOptionalEnvVariable(...args),
}));

jest.mock("../lib/secrets/secrets-manager-client", () => ({
  AwsSecretsClient: jest.fn().mockImplementation(() => ({
    getSecretValue: mockGetSecretValue,
  })),
}));

jest.mock("../lib/postcode-lookup/postcode-lookup-service", () => ({
  PostcodeLookupService: jest.fn().mockImplementation(() => mockPostcodeLookupServiceInstance),
}));

jest.mock("../lib/postcode-lookup/osplaces/osplaces-client", () => ({
  OSPlacesClient: jest.fn().mockImplementation(() => ({})),
}));

jest.mock("../lib/postcode-lookup/stub/stub-client", () => ({
  StubPostcodeLookupClient: jest.fn().mockImplementation(() => ({})),
}));

describe("postcode-lookup-lambda init", () => {
  const baseEnvValues: Record<string, string> = {
    POSTCODE_LOOKUP_CREDENTIALS_SECRET_NAME: "postcode-credentials-secret",
    POSTCODE_LOOKUP_BASE_URL: "https://api.os.uk/search/places/v1",
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
    mockGetSecretValue.mockResolvedValue(JSON.stringify({ apiKey: "test-api-key" }));
  });

  it("initializes and wires all dependencies with expected configuration", async () => {
    const { buildEnvironment: init } = await import("./init");
    const result = await init();

    const { AwsSecretsClient } = await import("../lib/secrets/secrets-manager-client");
    const { PostcodeLookupService } =
      await import("../lib/postcode-lookup/postcode-lookup-service");

    expect(AwsSecretsClient).toHaveBeenCalledWith("eu-west-2");
    expect(mockGetSecretValue).toHaveBeenCalledWith("postcode-credentials-secret");
    expect(PostcodeLookupService).toHaveBeenCalledTimes(1);

    expect(result).toEqual({
      postcodeLookupService: mockPostcodeLookupServiceInstance,
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
        .mockResolvedValue(JSON.stringify({ apiKey: "test-api-key" }));

      const { init: singletonInit } = await import("./init");

      await expect(singletonInit()).rejects.toThrow("Secrets Manager unavailable");

      // Second call should retry — not return the cached rejected Promise
      const result = await singletonInit();
      expect(result).toHaveProperty("postcodeLookupService");
    });
  });
});
