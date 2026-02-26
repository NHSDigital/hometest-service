import { init } from "./init";
import { PostgresDbClient } from "../lib/db/db-client";
import { OrderStatusService } from "../lib/db/order-status-db";
import { TransactionService } from "../lib/db/transaction-db-client";
import { AWSSQSClient } from "../lib/sqs/sqs-client";
import { AwsSecretsClient } from "../lib/secrets/secrets-manager-client";
import { postgresConfigFromEnv } from "../lib/db/db-config";
import {
  setupEnvironment,
  restoreEnvironment,
  testMissingEnvVars,
  testEmptyEnvVars,
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
jest.mock("../lib/db/db-client");
jest.mock("../lib/db/order-status-db");
jest.mock("../lib/db/transaction-db-client");
jest.mock("../lib/sqs/sqs-client");
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
    ORDER_PLACEMENT_QUEUE_URL:
      "https://sqs.eu-west-2.amazonaws.com/123456789012/order-placement",
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

    runAwsRegionTests({
      initFn: init,
      mockConstructor: AwsSecretsClient as jest.Mock,
    });

    it("should create PostgresDbClient with correct configuration", () => {
      testPostgresDbClientConfig(init, PostgresDbClient as jest.Mock, mockConfig);
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
    testMissingEnvVars({
      envVars: ["ORDER_PLACEMENT_QUEUE_URL"],
      testFn: init,
    });
  });

  describe("empty environment variables", () => {
    testEmptyEnvVars({
      envVars: ["ORDER_PLACEMENT_QUEUE_URL"],
      testFn: init,
    });
  });

  describe("integration of components", () => {
    it("should pass a PostgresDbClient instance to OrderStatusService", () => {
      testServiceReceivesDbClient(init, OrderStatusService as jest.Mock, PostgresDbClient, false);
    });

    it("should pass a PostgresDbClient instance to TransactionService", () => {
      testServiceReceivesDbClient(init, TransactionService as jest.Mock, PostgresDbClient, true);
    });

    it("should create components in the correct order", () => {
      testComponentCreationOrder({
        initFn: init,
        components: [
          { mock: AwsSecretsClient as jest.Mock },
          { mock: PostgresDbClient as jest.Mock, calledWith: expect.any(Object) },
          { mock: OrderStatusService as jest.Mock, calledWith: expect.any(PostgresDbClient) },
          { mock: TransactionService as jest.Mock, calledWith: { dbClient: expect.any(PostgresDbClient) } },
          { mock: AWSSQSClient as jest.Mock },
        ],
      });
    });
  });
});
