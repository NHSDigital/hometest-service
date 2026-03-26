import { PostgresDbClient } from "../lib/db/db-client";
import { postgresConfigFromEnv } from "../lib/db/db-config";
import { SupplierService } from "../lib/db/supplier-db";
import { TestResultDbClient } from "../lib/db/test-result-db-client";
import { FetchHttpClient } from "../lib/http/http-client";
import { AwsSecretsClient } from "../lib/secrets/secrets-manager-client";
import { SupplierTestResultsService } from "../lib/supplier/supplier-test-results-service";
import { testComponentCreationOrder } from "../lib/test-utils/component-integration-helpers";
import { restoreEnvironment, setupEnvironment } from "../lib/test-utils/environment-test-helpers";
import { init } from "./init";

jest.mock("../lib/http/http-client");
jest.mock("../lib/db/supplier-db");
jest.mock("../lib/db/db-client");
jest.mock("../lib/secrets/secrets-manager-client");
jest.mock("../lib/db/test-result-db-client");
jest.mock("../lib/supplier/supplier-test-results-service");
jest.mock("../lib/db/db-config");

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
    setupEnvironment(mockEnvVariables);

    (postgresConfigFromEnv as jest.Mock).mockReturnValue(mockPostgresConfig);
  });

  afterEach(() => {
    restoreEnvironment(originalEnv);
  });

  describe("successful initialization", () => {
    it("should initialize all components with correct configuration", () => {
      process.env.AWS_REGION = "eu-west-2";

      const result = init();

      expect(result).toHaveProperty("testResultDbClient");
      expect(result).toHaveProperty("supplierTestResultsService");
      expect(result.testResultDbClient).toBeInstanceOf(TestResultDbClient);
      expect(result.supplierTestResultsService).toBeInstanceOf(SupplierTestResultsService);
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

    it("should create TestResultDbClient with PostgresDbClient instance", () => {
      init();

      expect(TestResultDbClient).toHaveBeenCalledWith(expect.any(PostgresDbClient));
    });

    it("should create SupplierService with PostgresDbClient instance", () => {
      init();

      expect(SupplierService).toHaveBeenCalledWith({
        dbClient: expect.any(PostgresDbClient),
      });
    });

    it("should create FetchHttpClient", () => {
      init();

      expect(FetchHttpClient).toHaveBeenCalled();
    });

    it("should create SupplierTestResultsService with correct dependencies", () => {
      init();

      expect(SupplierTestResultsService).toHaveBeenCalledWith(
        expect.any(FetchHttpClient),
        expect.any(AwsSecretsClient),
        expect.any(SupplierService),
      );
    });

    it("should return an Environment object with all required properties", () => {
      const result = init();

      expect(result).toEqual({
        testResultDbClient: expect.any(TestResultDbClient),
        supplierTestResultsService: expect.any(SupplierTestResultsService),
      });
    });
  });

  describe("integration of components", () => {
    it("should pass a PostgresDbClient instance to TestResultDbClient", () => {
      init();

      const testResultDbClientCalls = (TestResultDbClient as jest.Mock).mock.calls;
      expect(testResultDbClientCalls[0][0]).toBeInstanceOf(PostgresDbClient);
    });

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
      testComponentCreationOrder({
        initFn: init,
        components: [
          {
            mock: FetchHttpClient as jest.Mock,
            times: 1,
          },
          {
            mock: AwsSecretsClient as jest.Mock,
            times: 1,
          },
          {
            mock: PostgresDbClient as jest.Mock,
            times: 1,
            calledWith: mockPostgresConfig,
          },
          {
            mock: TestResultDbClient as jest.Mock,
            times: 1,
            calledWith: expect.any(PostgresDbClient),
          },
          {
            mock: SupplierService as jest.Mock,
            times: 1,
            calledWith: {
              dbClient: expect.any(PostgresDbClient),
            },
          },
          {
            mock: SupplierTestResultsService as jest.Mock,
            times: 1,
          },
        ],
      });
    });
  });
});
