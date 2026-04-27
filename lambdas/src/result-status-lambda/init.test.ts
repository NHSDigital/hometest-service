import { postgresConfigFromEnv } from "../lib/db/db-config";
import { OrderService } from "../lib/db/order-db";
import { OrderStatusNotifyService } from "../lib/notify/services/order-status-notify-service";
import { AwsSecretsClient } from "../lib/secrets/secrets-manager-client";
import { init } from "./init";

// Mock all external dependencies
jest.mock("../lib/db/db-client");
jest.mock("../lib/db/db-config");
jest.mock("../lib/secrets/secrets-manager-client");
jest.mock("../lib/db/order-db");
jest.mock("../lib/db/patient-db-client");
jest.mock("../lib/db/notification-audit-db-client");
jest.mock("../lib/sqs/sqs-client");
jest.mock("../lib/notify/services/order-status-notify-service");

describe("init", () => {
  const originalEnv = process.env;

  const mockEnvVariables = {
    AWS_REGION: "eu-west-2",
    DB_USERNAME: "test-username",
    DB_ADDRESS: "test-address",
    DB_PORT: "5432",
    DB_NAME: "test-database",
    DB_SCHEMA: "test-schema",
    DB_SECRET_NAME: "test-secret-name",
    NOTIFY_MESSAGES_QUEUE_URL: "https://example.queue.local/notify",
    HOME_TEST_BASE_URL: "https://hometest.example.nhs.uk",
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

      expect(result).toHaveProperty("orderService");
      expect(result).toHaveProperty("orderStatusNotifyService");
      expect(result.orderService).toBeInstanceOf(OrderService);
      expect(result.orderStatusNotifyService).toBeInstanceOf(OrderStatusNotifyService);
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

    it("should throw when AWS_REGION is not set", () => {
      delete process.env.AWS_REGION;

      jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { init: initModule } = require("./init");
        expect(() => initModule()).toThrow("Missing value for an environment variable AWS_REGION");
      });
    });

    it("should return an Environment object with all required properties", () => {
      const result = init();

      expect(result).toEqual({
        orderService: expect.any(OrderService),
        orderStatusNotifyService: expect.any(OrderStatusNotifyService),
      });
    });

    it("should create OrderStatusNotifyService with notifyMessagesQueueUrl", () => {
      jest.isolateModules(() => {
        const {
          NotificationAuditDbClient: NotificationAuditDbClientModule,
        } = require("../lib/db/notification-audit-db-client");

        const {
          OrderResultAvailableMessageBuilder: OrderResultAvailableMessageBuilderModule,
        } = require("../lib/notify/message-builders/order-status/order-result-available-message-builder");
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { AWSSQSClient: AWSSQSClientModule } = require("../lib/sqs/sqs-client");
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { init: initModule } = require("./init");

        initModule();

        expect(OrderStatusNotifyService).toHaveBeenCalledWith(
          expect.objectContaining({
            notifyMessageBuilders: expect.objectContaining({
              COMPLETE: expect.any(OrderResultAvailableMessageBuilderModule),
            }),
            notifyMessagesQueueUrl: "https://example.queue.local/notify",
            notificationAuditDbClient: expect.any(NotificationAuditDbClientModule),
            sqsClient: expect.any(AWSSQSClientModule),
          }),
        );
      });
    });
  });

  describe("singleton behavior", () => {
    it("should return the same Environment instance on multiple calls to init", () => {
      const env1 = init();
      const env2 = init();

      expect(env1).toBe(env2);
    });
  });

  describe("rejection retry", () => {
    beforeEach(() => {
      process.env.AWS_REGION = "us-east-1";
    });

    it("should allow retry after buildEnvironment throws", () => {
      jest.isolateModules(() => {
        jest.clearAllMocks();
        (OrderService as jest.Mock).mockImplementationOnce(() => {
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
