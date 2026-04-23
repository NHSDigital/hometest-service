import { PostgresDbClient } from "../lib/db/db-client";
import { postgresConfigFromEnv } from "../lib/db/db-config";
import { NotificationAuditDbClient } from "../lib/db/notification-audit-db-client";
import { OrderService } from "../lib/db/order-db";
import { AWSLambdaClient } from "../lib/lambda/lambda-client";
import { OrderResultAvailableMessageBuilder } from "../lib/notify/message-builders/order-status/order-result-available-message-builder";
import { OrderStatusNotifyService } from "../lib/notify/services/order-status-notify-service";
import { AwsSecretsClient } from "../lib/secrets/secrets-manager-client";
import { AWSSQSClient } from "../lib/sqs/sqs-client";
import { buildEnvironment as init } from "./init";
import { ResultProcessingHandoffService } from "./result-processing-service";

jest.mock("../lib/db/db-client");
jest.mock("../lib/db/db-config");
jest.mock("../lib/db/order-db");
jest.mock("../lib/db/patient-db-client");
jest.mock("../lib/db/notification-audit-db-client");
jest.mock("../lib/commons");
jest.mock("../lib/secrets/secrets-manager-client");
jest.mock("../lib/sqs/sqs-client");
jest.mock("../lib/notify/services/order-status-notify-service");
jest.mock("../lib/lambda/lambda-client");

describe("order-result-lambda init", () => {
  const originalEnv = process.env;

  const mockEnvVariables = {
    DB_USERNAME: "test-username",
    DB_ADDRESS: "test-address",
    DB_PORT: "5432",
    DB_NAME: "test-database",
    DB_SCHEMA: "test-schema",
    DB_SECRET_NAME: "test-secret-name",
    AWS_REGION: "eu-west-2",
    NOTIFY_MESSAGES_QUEUE_URL: "https://example.queue.local/notify",
    HOME_TEST_BASE_URL: "https://hometest.example.nhs.uk",
    RESULT_PROCESSING_FUNCTION_NAME: "hometest-service-hiv-results-processor",
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
    process.env = { ...originalEnv };
    Object.assign(process.env, mockEnvVariables);
    (postgresConfigFromEnv as jest.Mock).mockReturnValue(mockPostgresConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("initializes the lambda environment with direct result processing handoff", () => {
    const result = init();

    expect(result).toHaveProperty("orderService");
    expect(result).toHaveProperty("resultProcessingService");
    expect(result).toHaveProperty("orderStatusNotifyService");
    expect(result.orderService).toBeInstanceOf(OrderService);
    expect(result.orderStatusNotifyService).toBeInstanceOf(OrderStatusNotifyService);
    expect(result.resultProcessingService).toBeInstanceOf(ResultProcessingHandoffService);
  });

  it("creates AwsSecretsClient with AWS_REGION when set", () => {
    process.env.AWS_REGION = "us-east-1";

    init();

    expect(AwsSecretsClient).toHaveBeenCalledWith("us-east-1");
  });

  it("throws when AWS_REGION is not set", () => {
    delete process.env.AWS_REGION;

    expect(() => init()).toThrow("Missing value for an environment variable AWS_REGION");
  });

  it("throws when RESULT_PROCESSING_FUNCTION_NAME is not set", () => {
    delete process.env.RESULT_PROCESSING_FUNCTION_NAME;

    expect(() => init()).toThrow(
      "Missing value for an environment variable RESULT_PROCESSING_FUNCTION_NAME",
    );
  });

  it("creates PostgresDbClient with correct configuration", () => {
    init();

    expect(PostgresDbClient).toHaveBeenCalledWith(mockPostgresConfig);
  });

  it("creates a direct lambda client with AWS region", () => {
    init();
    expect(AWSLambdaClient).toHaveBeenCalledWith("eu-west-2");
  });

  it("should create OrderStatusNotifyService with notifyMessagesQueueUrl", () => {
    init();

    expect(OrderStatusNotifyService).toHaveBeenCalledWith(
      expect.objectContaining({
        notifyMessageBuilders: expect.objectContaining({
          COMPLETE: expect.any(OrderResultAvailableMessageBuilder),
        }),
        notifyMessagesQueueUrl: "https://example.queue.local/notify",
        notificationAuditDbClient: expect.any(NotificationAuditDbClient),
        sqsClient: expect.any(AWSSQSClient),
      }),
    );
  });

  it("returns an Environment object with all required properties", () => {
    const result = init();

    expect(result).toEqual({
      orderService: expect.any(OrderService),
      resultProcessingService: expect.any(ResultProcessingHandoffService),
      orderStatusNotifyService: expect.any(OrderStatusNotifyService),
    });
  });

  describe("singleton protection", () => {
    it("constructs dependencies once no matter how many times init() is called", () => {
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
    it("allows retry after buildEnvironment throws", () => {
      jest.isolateModules(() => {
        jest.clearAllMocks();
        (PostgresDbClient as jest.Mock).mockImplementationOnce(() => {
          throw new Error("DB connection failed");
        });
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { init: singletonInit } = require("./init");

        expect(() => singletonInit()).toThrow("DB connection failed");

        const result = singletonInit();
        expect(result).toBeTruthy();
      });
    });
  });
});
