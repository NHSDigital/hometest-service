import { ConsoleCommons } from "../lib/commons";
import { postgresConfigFromEnv } from "../lib/db/db-config";
import { OrderService } from "../lib/db/order-db";
import { ResultService } from "../lib/db/result-db";
import { AwsSecretsClient } from "../lib/secrets/secrets-manager-client";
import { buildEnvironment, init } from "./init";

// Mock all external dependencies
jest.mock("../lib/db/db-client");
jest.mock("../lib/db/db-config");
jest.mock("../lib/secrets/secrets-manager-client");
jest.mock("../lib/commons");
jest.mock("../lib/db/result-db");
jest.mock("../lib/db/order-db");

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
    beforeEach(async () => {
      jest.clearAllMocks();
      (postgresConfigFromEnv as jest.Mock).mockReturnValue(mockPostgresConfig);
    });

    it("should initialize all components with correct configuration", async () => {
      process.env.AWS_REGION = "eu-west-2";

      const result = init();

      expect(result).toHaveProperty("commons");
      expect(result).toHaveProperty("resultService");
      expect(result).toHaveProperty("orderService");
      expect(result.commons).toBeInstanceOf(ConsoleCommons);
      expect(result.resultService).toBeInstanceOf(ResultService);
      expect(result.orderService).toBeInstanceOf(OrderService);
    });

    it("should create AwsSecretsClient with AWS_REGION when set", () => {
      process.env.AWS_REGION = "us-east-1";

      jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { init: initModule } = require("./init");
        initModule();
        expect(AwsSecretsClient).toHaveBeenCalledWith("us-east-1");
      });
    });

    it("should create AwsSecretsClient with AWS_DEFAULT_REGION when AWS_REGION is not set", () => {
      delete process.env.AWS_REGION;
      process.env.AWS_DEFAULT_REGION = "us-west-2";

      jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { init: initModule } = require("./init");
        initModule();
        expect(AwsSecretsClient).toHaveBeenCalledWith("us-west-2");
      });
    });

    it("should default to eu-west-2 when neither AWS_REGION nor AWS_DEFAULT_REGION is set", () => {
      delete process.env.AWS_REGION;
      delete process.env.AWS_DEFAULT_REGION;

      jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { init: initModule } = require("./init");
        initModule();
        expect(AwsSecretsClient).toHaveBeenCalledWith("eu-west-2");
      });
    });

    it("should return an Environment object with all required properties", () => {
      const result = init();

      expect(result).toEqual({
        commons: expect.any(ConsoleCommons),
        resultService: expect.any(ResultService),
        orderService: expect.any(OrderService),
      });
    });
  });

  describe("Integration of components", () => {
    it("should create ResultService and OrderService with the same dbClient instance", () => {
      buildEnvironment();

      // Extract the dbClient instances from the mocked constructors
      const resultServiceDbClient = (ResultService as jest.Mock).mock.calls[0][0];
      const orderServiceDbClient = (OrderService as jest.Mock).mock.calls[0][0];

      expect(resultServiceDbClient).toBe(orderServiceDbClient);
    });

    it("should create ResultService and OrderService with the same commons instance", () => {
      buildEnvironment();

      // Extract the commons instances from the mocked constructors
      const resultServiceCommons = (ResultService as jest.Mock).mock.calls[0][1];
      const orderServiceCommons = (OrderService as jest.Mock).mock.calls[0][1];

      expect(resultServiceCommons).toBe(orderServiceCommons);
    });
  });

  describe("singleton behavior", () => {
    it("should return the same Environment instance on multiple calls to init", () => {
      const env1 = init();
      const env2 = init();

      expect(env1).toBe(env2);
    });
  });
});
