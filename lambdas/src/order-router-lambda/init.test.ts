import { init } from "./init";
import { FetchHttpClient } from "../lib/http/http-client";
import { SupplierService } from "../lib/db/supplier-db";
import { PostgresDbClient } from "../lib/db/db-client";
import { AwsSecretsClient } from "../lib/secrets/secrets-manager-client";
import { postgresConfigFromEnv } from "../lib/db/db-config";
import {
  setupEnvironment,
  restoreEnvironment,
} from "../lib/test-utils/environment-test-helpers";
import {
  runAwsRegionTests,
  testPostgresDbClientConfig,
} from "../lib/test-utils/aws-region-test-helpers";
import {
  testServiceReceivesDbClient,
  testComponentCreationOrder,
} from "../lib/test-utils/component-integration-helpers";

// Mock all external dependencies
jest.mock("../lib/http/http-client");
jest.mock("../lib/db/supplier-db");
jest.mock("../lib/db/db-client");
jest.mock("../lib/secrets/secrets-manager-client");
jest.mock("../lib/db/db-config");

describe("init", () => {
  let originalEnv: NodeJS.ProcessEnv;

  const mockEnvVariables = {
    DB_USERNAME: "test-username",
    DB_ADDRESS: "test-address",
    DB_PORT: "5432",
    DB_NAME: "test-database",
    DB_SCHEMA: "test-schema",
    DB_SECRET_NAME: "test-secret-name",
  };

  const mockConfig = {
    user: "test-user",
    host: "test-host",
    port: 5432,
    database: "test-db",
    password: jest.fn().mockResolvedValue("test-password"),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    originalEnv = setupEnvironment(mockEnvVariables);
    (postgresConfigFromEnv as jest.Mock).mockReturnValue(mockConfig);
  });

  afterEach(() => {
    restoreEnvironment(originalEnv);
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

    runAwsRegionTests({
      initFn: init,
      mockConstructor: AwsSecretsClient as jest.Mock,
    });

    it("should create PostgresDbClient with correct configuration", () => {
      testPostgresDbClientConfig(init, PostgresDbClient as jest.Mock, mockConfig);
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

  describe("integration of components", () => {
    it("should pass a PostgresDbClient instance to SupplierService", () => {
      testServiceReceivesDbClient(init, SupplierService as jest.Mock, PostgresDbClient, true);
    });

    it("should create components in the correct order", () => {
      testComponentCreationOrder({
        initFn: init,
        components: [
          { mock: AwsSecretsClient as jest.Mock },
          { mock: PostgresDbClient as jest.Mock, calledWith: expect.any(Object) },
          { mock: SupplierService as jest.Mock, calledWith: { dbClient: expect.any(PostgresDbClient) } },
        ],
      });
    });
  });
});
