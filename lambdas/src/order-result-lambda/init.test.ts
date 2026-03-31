import { ConsoleCommons } from "../lib/commons";
import { PostgresDbClient } from "../lib/db/db-client";
import { postgresConfigFromEnv } from "../lib/db/db-config";
import { OrderService } from "../lib/db/order-db";
import { AwsSecretsClient } from "../lib/secrets/secrets-manager-client";
import { buildEnvironment as init } from "./init";

jest.mock("../lib/db/db-client");
jest.mock("../lib/db/db-config");
jest.mock("../lib/db/order-db");
jest.mock("../lib/commons");
jest.mock("../lib/secrets/secrets-manager-client");

describe("order-result-lambda init", () => {
  const originalEnv = process.env;

  const mockEnvVariables = {
    DB_USERNAME: "test-username",
    DB_ADDRESS: "test-address",
    DB_PORT: "5432",
    DB_NAME: "test-database",
    DB_SCHEMA: "test-schema",
    DB_SECRET_NAME: "test-secret-name",
    ORDER_PLACEMENT_QUEUE_URL: "https://sqs.eu-west-2.amazonaws.com/123456789012/order-placement",
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
    jest.clearAllMocks();
  });

  it("should initialize all components with correct configuration", () => {
    process.env.AWS_REGION = "eu-west-2";

    const result = init();

    expect(result).toHaveProperty("commons");
    expect(result).toHaveProperty("orderService");
    expect(result.commons).toBeInstanceOf(ConsoleCommons);
    expect(result.orderService).toBeInstanceOf(OrderService);
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

  it("should create ConsoleCommons", () => {
    init();

    expect(ConsoleCommons).toHaveBeenCalledWith();
  });

  it("should return an Environment object with all required properties", () => {
    const result = init();

    expect(result).toEqual({
      orderService: expect.any(OrderService),
      commons: expect.any(ConsoleCommons),
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

  describe("rejection retry", () => {
    it("should allow retry after buildEnvironment throws", () => {
      jest.isolateModules(() => {
        jest.clearAllMocks();
        (PostgresDbClient as jest.Mock).mockImplementationOnce(() => {
          throw new Error("DB connection failed");
        });
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { init: singletonInit } = require("./init");

        expect(() => singletonInit()).toThrow("DB connection failed");

        // _env was never assigned (??= only assigns if the expression completes)
        const result = singletonInit();
        expect(result).toBeTruthy();
      });
    });
  });
});
