import { init } from "./init";
import { FetchHttpClient } from "../lib/http/http-client";
import { SupplierService } from "../lib/db/supplier-db";
import { PostgresDbClient } from "../lib/db/db-client";
import { AwsSecretsClient } from "../lib/secrets/secrets-manager-client";

// Mock all external dependencies
jest.mock("../lib/http/http-client");
jest.mock("../lib/db/supplier-db");
jest.mock("../lib/db/db-client");
jest.mock("../lib/secrets/secrets-manager-client");

describe("init", () => {
  const originalEnv = process.env;

  const mockEnvVariables = {
    DB_USERNAME: "test-username",
    DB_ADDRESS: "test-address",
    DB_PORT: "5432",
    DB_NAME: "test-database",
    DB_SCHEMA: "test-schema",
    DB_SECRET_NAME: "test-secret-name",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset process.env to a clean state
    process.env = { ...originalEnv };
    // Set default mock environment variables
    Object.assign(process.env, mockEnvVariables);
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
  });

  describe("successful initialization", () => {
    it("should initialize all components with correct configuration", () => {
      process.env.AWS_REGION = "eu-west-2";

      const result = init();

      expect(result).toHaveProperty("httpClient");
      expect(result).toHaveProperty("supplierDb");
      expect(result).toHaveProperty("secretsClient");
      expect(result.httpClient).toBeInstanceOf(FetchHttpClient);
      expect(result.secretsClient).toBeInstanceOf(AwsSecretsClient);
      expect(result.supplierDb).toBeInstanceOf(SupplierService);
    });

    it("should create AwsSecretsClient with AWS_REGION when set", () => {
      process.env.AWS_REGION = "us-east-1";

      init();

      expect(AwsSecretsClient).toHaveBeenCalledWith("us-east-1");
    });

    it("should create AwsSecretsClient with AWS_DEFAULT_REGION when AWS_REGION is not set", () => {
      delete process.env.AWS_REGION;
      process.env.AWS_DEFAULT_REGION = "us-west-2";

      init();

      expect(AwsSecretsClient).toHaveBeenCalledWith("us-west-2");
    });

    it("should default to eu-west-2 when neither AWS_REGION nor AWS_DEFAULT_REGION is set", () => {
      delete process.env.AWS_REGION;
      delete process.env.AWS_DEFAULT_REGION;

      init();

      expect(AwsSecretsClient).toHaveBeenCalledWith("eu-west-2");
    });

    it("should create PostgresDbClient with correct configuration", () => {
      process.env.AWS_REGION = "eu-west-2";

      init();

      expect(PostgresDbClient).toHaveBeenCalledWith(
        {
          username: "test-username",
          address: "test-address",
          port: "5432",
          database: "test-database",
          schema: "test-schema",
          passwordSecretName: "test-secret-name",
        },
        expect.any(AwsSecretsClient),
      );
    });

    it("should create SupplierService with PostgresDbClient instance", () => {
      init();

      expect(SupplierService).toHaveBeenCalledWith({
        dbClient: expect.any(PostgresDbClient),
      });
    });

    it("should return an Environment object with all required properties", () => {
      const result = init();

      expect(result).toEqual({
        httpClient: expect.any(FetchHttpClient),
        supplierDb: expect.any(SupplierService),
        secretsClient: expect.any(AwsSecretsClient),
      });
    });
  });

  describe("missing environment variables", () => {
    it.each([
      ["DB_USERNAME"],
      ["DB_ADDRESS"],
      ["DB_PORT"],
      ["DB_NAME"],
      ["DB_SCHEMA"],
      ["DB_SECRET_NAME"],
    ])("should throw error when %s is missing", (envVar) => {
      delete process.env[envVar];

      expect(() => init()).toThrow(
        `Missing value for an environment variable ${envVar}`,
      );
    });
  });

  describe("empty environment variables", () => {
    it.each([
      ["DB_USERNAME"],
      ["DB_ADDRESS"],
      ["DB_PORT"],
      ["DB_NAME"],
      ["DB_SCHEMA"],
      ["DB_SECRET_NAME"],
    ])("should throw error when %s is empty string", (envVar) => {
      process.env[envVar] = "";

      expect(() => init()).toThrow(
        `Missing value for an environment variable ${envVar}`,
      );
    });
  });

  describe("integration of components", () => {
    it("should pass an AwsSecretsClient instance to PostgresDbClient", () => {
      init();

      const postgresDbClientCalls = (PostgresDbClient as jest.Mock).mock.calls;
      expect(postgresDbClientCalls[0][1]).toBeInstanceOf(AwsSecretsClient);
    });

    it("should pass a PostgresDbClient instance to SupplierService", () => {
      init();

      const supplierServiceCalls = (SupplierService as jest.Mock).mock.calls;
      expect(supplierServiceCalls[0][0].dbClient).toBeInstanceOf(
        PostgresDbClient,
      );
    });

    it("should create components in the correct order", () => {
      init();

      // AwsSecretsClient should be created first
      expect(AwsSecretsClient).toHaveBeenCalledTimes(1);

      // PostgresDbClient should be created with an AwsSecretsClient
      expect(PostgresDbClient).toHaveBeenCalledTimes(1);
      expect(PostgresDbClient).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(AwsSecretsClient),
      );

      // SupplierService should be created with a PostgresDbClient
      expect(SupplierService).toHaveBeenCalledTimes(1);
      expect(SupplierService).toHaveBeenCalledWith({
        dbClient: expect.any(PostgresDbClient),
      });
    });
  });
});
