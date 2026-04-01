<<<<<<< HEAD
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
=======
import { AwsSecretsClient } from "../lib/secrets/secrets-manager-client";
import { OSPlacesClient } from "../lib/postcode-lookup/osplaces/osplaces-client";
import { StubPostcodeLookupClient } from "../lib/postcode-lookup/stub/stub-client";
import { PostcodeLookupService } from "../lib/postcode-lookup/postcode-lookup-service";

jest.mock("../lib/secrets/secrets-manager-client", () => ({
  AwsSecretsClient: jest.fn().mockImplementation(() => ({
    getSecretValue: jest.fn().mockResolvedValue(JSON.stringify({ apiKey: "test-api-key" })),
  })),
}));
// are these mocks all needed?
jest.mock("../lib/postcode-lookup/osplaces/osplaces-client");
jest.mock("../lib/postcode-lookup/stub/stub-client");
jest.mock("../lib/postcode-lookup/postcode-lookup-service");

import { init } from "./init"; //TODO can this be at top?

describe("postcode-lookup-lambda init", () => {

  const originalEnv = process.env;

  const mockEnvVariables = {
    POSTCODE_LOOKUP_CREDENTIALS_SECRET_NAME: "test-secret-name",
    POSTCODE_LOOKUP_BASE_URL: "https://api.postcode-lookup.com",
    POSTCODE_LOOKUP_TIMEOUT_MS: "5000",
    POSTCODE_LOOKUP_MAX_RETRIES: "3",
    POSTCODE_LOOKUP_RETRY_DELAY_MS: "1000",
    POSTCODE_LOOKUP_RETRY_BACKOFF_FACTOR: "2",
    USE_STUB_POSTCODE_CLIENT: "false",
    POSTCODE_LOOKUP_REJECT_UNAUTHORIZED: "true",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    Object.assign(process.env, mockEnvVariables);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  // it("should initialize all components with correct configuration", async () => {

  // });

  it("should initialize all components with correct configuration", async () => {
      const mockGetSecretValue = jest.fn().mockResolvedValue(JSON.stringify({ apiKey: "test-api-key" }));
      (AwsSecretsClient as jest.Mock).mockImplementation(() => ({
        getSecretValue: mockGetSecretValue,
      }));

      const postcodeLookupServiceInstance = {};
      (PostcodeLookupService as jest.Mock).mockImplementation(() => postcodeLookupServiceInstance);

      const osPlacesClientInstance = {};
      (OSPlacesClient as jest.Mock).mockImplementation(() => osPlacesClientInstance);

      const result = await init();

      expect(AwsSecretsClient).toHaveBeenCalledWith(expect.any(String));
      expect(mockGetSecretValue).toHaveBeenCalledWith("test-secret-name");
      expect(OSPlacesClient).toHaveBeenCalledWith(
        expect.objectContaining({
          credentials: { apiKey: "test-api-key" },
          baseUrl: "https://api.postcode-lookup.com",
          timeoutMs: 5000,
          maxRetries: 3,
          retryDelayMs: 1000,
          retryBackoffFactor: 2,
          rejectUnauthorized: true,
        })
      );
      expect(PostcodeLookupService).toHaveBeenCalledWith(osPlacesClientInstance);
      expect(result).toEqual({ postcodeLookupService: postcodeLookupServiceInstance });
    });

    it("should use StubPostcodeLookupClient when USE_STUB_POSTCODE_CLIENT is true", async () => {
      process.env.USE_STUB_POSTCODE_CLIENT = "true";
      const mockGetSecretValue = jest.fn().mockResolvedValue(JSON.stringify({ apiKey: "stub-api-key" }));
      (AwsSecretsClient as jest.Mock).mockImplementation(() => ({
        getSecretValue: mockGetSecretValue,
      }));

      const stubClientInstance = {};
      (StubPostcodeLookupClient as jest.Mock).mockImplementation(() => stubClientInstance);

      const postcodeLookupServiceInstance = {};
      (PostcodeLookupService as jest.Mock).mockImplementation(() => postcodeLookupServiceInstance);

      const result = await init();

      expect(StubPostcodeLookupClient).toHaveBeenCalledWith(
        expect.objectContaining({
          credentials: { apiKey: "stub-api-key" },
          baseUrl: "https://api.postcode-lookup.com",
          timeoutMs: 5000,
          maxRetries: 3,
          retryDelayMs: 1000,
          retryBackoffFactor: 2,
          rejectUnauthorized: true,
        })
      );
      expect(PostcodeLookupService).toHaveBeenCalledWith(stubClientInstance);
      expect(result).toEqual({ postcodeLookupService: postcodeLookupServiceInstance });
    });

    it("should use default values for optional env vars if not set", async () => {
      delete process.env.POSTCODE_LOOKUP_TIMEOUT_MS;
      delete process.env.POSTCODE_LOOKUP_MAX_RETRIES;
      delete process.env.POSTCODE_LOOKUP_RETRY_DELAY_MS;
      delete process.env.POSTCODE_LOOKUP_RETRY_BACKOFF_FACTOR;
      delete process.env.POSTCODE_LOOKUP_REJECT_UNAUTHORIZED;

      const mockGetSecretValue = jest.fn().mockResolvedValue(JSON.stringify({ apiKey: "default-api-key" }));
      (AwsSecretsClient as jest.Mock).mockImplementation(() => ({
        getSecretValue: mockGetSecretValue,
      }));

      const osPlacesClientInstance = {};
      (OSPlacesClient as jest.Mock).mockImplementation(() => osPlacesClientInstance);

      const postcodeLookupServiceInstance = {};
      (PostcodeLookupService as jest.Mock).mockImplementation(() => postcodeLookupServiceInstance);

      const result = await init();

      expect(OSPlacesClient).toHaveBeenCalledWith(
        expect.objectContaining({
          timeoutMs: 5000,
          maxRetries: 3,
          retryDelayMs: 1000,
          retryBackoffFactor: 2,
          rejectUnauthorized: false,
        })
      );
      expect(result).toEqual({ postcodeLookupService: postcodeLookupServiceInstance });
    });



  // describe("postcode-lookup-lambda init", () => {
  // });
>>>>>>> cd1f3331 ([HOTE-837] feat: improve test coverage)
});
