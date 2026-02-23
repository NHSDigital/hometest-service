import { init } from "./init";
import { PostgresDbClient } from "../lib/db/db-client";
import { OrderStatusService } from "../lib/db/order-status-db";
import { TransactionService } from "../lib/db/transaction-db-client";
import { AWSSQSClient } from "../lib/sqs/sqs-client";
import { AwsSecretsClient } from "../lib/secrets/secrets-manager-client";

// Mock all external dependencies
jest.mock("../lib/db/db-client");
jest.mock("../lib/db/order-status-db");
jest.mock("../lib/db/transaction-db-client");
jest.mock("../lib/sqs/sqs-client");
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
    ORDER_PLACEMENT_QUEUE_URL:
      "https://sqs.eu-west-2.amazonaws.com/123456789012/order-placement",
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

      expect(result).toHaveProperty("orderStatusService");
      expect(result).toHaveProperty("transactionService");
      expect(result).toHaveProperty("sqsClient");
      expect(result).toHaveProperty("orderPlacementQueueUrl");
      expect(result.orderStatusService).toBeInstanceOf(OrderStatusService);
      expect(result.transactionService).toBeInstanceOf(TransactionService);
      expect(result.sqsClient).toBeInstanceOf(AWSSQSClient);
      expect(result.orderPlacementQueueUrl).toBe(
        "https://sqs.eu-west-2.amazonaws.com/123456789012/order-placement",
      );
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

    it("should create OrderStatusService with PostgresDbClient instance", () => {
      init();

      expect(OrderStatusService).toHaveBeenCalledWith(
        expect.any(PostgresDbClient),
      );
    });

    it("should create TransactionService with PostgresDbClient instance", () => {
      init();

      expect(TransactionService).toHaveBeenCalledWith({
        dbClient: expect.any(PostgresDbClient),
      });
    });

    it("should create AWSSQSClient", () => {
      init();

      expect(AWSSQSClient).toHaveBeenCalledWith();
    });

    it("should return an Environment object with all required properties", () => {
      const result = init();

      expect(result).toEqual({
        orderStatusService: expect.any(OrderStatusService),
        transactionService: expect.any(TransactionService),
        sqsClient: expect.any(AWSSQSClient),
        orderPlacementQueueUrl:
          "https://sqs.eu-west-2.amazonaws.com/123456789012/order-placement",
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
      ["ORDER_PLACEMENT_QUEUE_URL"],
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
      ["ORDER_PLACEMENT_QUEUE_URL"],
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

    it("should pass a PostgresDbClient instance to OrderStatusService", () => {
      init();

      const orderStatusServiceCalls = (OrderStatusService as jest.Mock).mock
        .calls;
      expect(orderStatusServiceCalls[0][0]).toBeInstanceOf(PostgresDbClient);
    });

    it("should pass a PostgresDbClient instance to TransactionService", () => {
      init();

      const transactionServiceCalls = (TransactionService as jest.Mock).mock
        .calls;
      expect(transactionServiceCalls[0][0].dbClient).toBeInstanceOf(
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

      // OrderStatusService should be created with a PostgresDbClient
      expect(OrderStatusService).toHaveBeenCalledTimes(1);
      expect(OrderStatusService).toHaveBeenCalledWith(
        expect.any(PostgresDbClient),
      );

      // TransactionService should be created with a PostgresDbClient
      expect(TransactionService).toHaveBeenCalledTimes(1);
      expect(TransactionService).toHaveBeenCalledWith({
        dbClient: expect.any(PostgresDbClient),
      });

      // AWSSQSClient should be created
      expect(AWSSQSClient).toHaveBeenCalledTimes(1);
    });
  });
});
