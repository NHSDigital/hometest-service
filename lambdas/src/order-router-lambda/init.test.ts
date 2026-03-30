import { PostgresDbClient } from "../lib/db/db-client";
import { postgresConfigFromEnv } from "../lib/db/db-config";
import { OrderStatusService } from "../lib/db/order-status-db";
import { SupplierService } from "../lib/db/supplier-db";
import { FetchHttpClient } from "../lib/http/http-client";
import { AwsSecretsClient } from "../lib/secrets/secrets-manager-client";
import { testComponentCreationOrder } from "../lib/test-utils/component-integration-helpers";
import { buildEnvironment as init } from "./init";

// Mock all external dependencies
jest.mock("../lib/http/http-client");
jest.mock("../lib/db/supplier-db");
jest.mock("../lib/db/db-client");
jest.mock("../lib/secrets/secrets-manager-client");
jest.mock("../lib/db/db-config");
jest.mock("../lib/db/order-status-db");

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

  // This represents the return value of postgresConfigFromEnv(secretsClient)
  const mockPostgresConfig = {
    user: "test-user",
    host: "test-host",
    port: 5432,
    database: "test-db",
    password: jest.fn().mockResolvedValue("test-password"),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset process.env to a clean state
    process.env = { ...originalEnv };
    // Set default mock environment variables
    Object.assign(process.env, mockEnvVariables);

    (postgresConfigFromEnv as jest.Mock).mockReturnValue(mockPostgresConfig);
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
      expect(result).toHaveProperty("orderStatusService");
      expect(result.httpClient).toBeInstanceOf(FetchHttpClient);
      expect(result.secretsClient).toBeInstanceOf(AwsSecretsClient);
      expect(result.supplierDb).toBeInstanceOf(SupplierService);
      expect(result.orderStatusService).toBeInstanceOf(OrderStatusService);
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

      expect(PostgresDbClient).toHaveBeenCalledWith(mockPostgresConfig);
    });

    it("should create SupplierService with PostgresDbClient instance", () => {
      init();

      expect(SupplierService).toHaveBeenCalledWith({
        dbClient: expect.any(PostgresDbClient),
      });
    });

    it("should create OrderStatusService with PostgresDbClient instance", () => {
      init();

      expect(OrderStatusService).toHaveBeenCalledWith(expect.any(PostgresDbClient));
    });

    it("should return an Environment object with all required properties", () => {
      const result = init();

      expect(result).toEqual({
        httpClient: expect.any(FetchHttpClient),
        supplierDb: expect.any(SupplierService),
        secretsClient: expect.any(AwsSecretsClient),
        orderStatusService: expect.any(OrderStatusService),
      });
    });
  });

  describe("integration of components", () => {
    it("should pass a PostgresDbClient instance to SupplierService", () => {
      init();

      const supplierServiceCalls = (SupplierService as jest.Mock).mock.calls;
      expect(supplierServiceCalls[0][0].dbClient).toBeInstanceOf(PostgresDbClient);
    });

    it("should call postgresConfigFromEnv with AwsSecretsClient instance", () => {
      init();

      expect(postgresConfigFromEnv).toHaveBeenCalledWith(expect.any(AwsSecretsClient));
    });

    it("should create components in the correct order", () => {
      // 1. AwsSecretsClient should be created first
      // 2. PostgresDbClient should be created with postgresConfigFromEnv(secretsClient)
      // 3. SupplierService should be created with a PostgresDbClient
      // 4. OrderStatusService should be created with a PostgresDbClient
      testComponentCreationOrder({
        initFn: init,
        components: [
          {
            mock: AwsSecretsClient as jest.Mock,
            times: 1,
          },
          {
            mock: PostgresDbClient as jest.Mock,
            times: 1,
            calledWith: mockPostgresConfig, // Result of postgresConfigFromEnv(secretsClient)
          },
          {
            mock: SupplierService as jest.Mock,
            times: 1,
            calledWith: {
              dbClient: expect.any(PostgresDbClient),
            },
          },
          {
            mock: OrderStatusService as jest.Mock,
            times: 1,
            calledWith: expect.any(PostgresDbClient),
          },
        ],
      });
    });
  });

  describe("singleton protection", () => {
    it("should only construct dependencies once no matter how many times init() is called", () => {
      jest.isolateModules(() => {
        jest.clearAllMocks();
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { init: singletonInit } = require("./init");

        const env1 = singletonInit();
        const env2 = singletonInit();

        expect(PostgresDbClient).toHaveBeenCalledTimes(1);
        expect(env1).toBe(env2);
      });
    });
  });
});
