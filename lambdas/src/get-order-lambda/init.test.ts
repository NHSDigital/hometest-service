import {
  restoreEnvironment,
  setupEnvironment,
} from "../lib/test-utils/environment-test-helpers";

import { AwsSecretsClient } from "../lib/secrets/secrets-manager-client";
import { OrderDbClient } from "../lib/db/order-db-client";
import { PostgresDbClient } from "../lib/db/db-client";
import { init } from "./init";
import { postgresConfigFromEnv } from "../lib/db/db-config";
import { testComponentCreationOrder } from "../lib/test-utils/component-integration-helpers";

jest.mock("../lib/db/order-db-client");
jest.mock("../lib/db/db-client");
jest.mock("../lib/secrets/secrets-manager-client");
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

      expect(result).toHaveProperty("orderDbClient");
      expect(result.orderDbClient).toBeInstanceOf(OrderDbClient);
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

    it("should create OrderDbClient with PostgresDbClient instance", () => {
      init();

      expect(OrderDbClient).toHaveBeenCalledWith(expect.any(PostgresDbClient));
    });

    it("should return an Environment object with all required properties", () => {
      const result = init();

      expect(result).toEqual({
        orderDbClient: expect.any(OrderDbClient),
      });
    });
  });

  describe("integration of components", () => {
    it("should pass a PostgresDbClient instance to OrderDbClient", () => {
      init();

      const orderDbClientCalls = (OrderDbClient as jest.Mock).mock.calls;
      expect(orderDbClientCalls[0][0]).toBeInstanceOf(PostgresDbClient);
    });

    it("should call postgresConfigFromEnv with AwsSecretsClient instance", () => {
      init();

      expect(postgresConfigFromEnv).toHaveBeenCalledWith(
        expect.any(AwsSecretsClient),
      );
    });

    it("should create components in the correct order", () => {
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
            calledWith: mockPostgresConfig,
          },
          {
            mock: OrderDbClient as jest.Mock,
            times: 1,
            calledWith: expect.any(PostgresDbClient),
          },
        ],
      });
    });
  });
});
