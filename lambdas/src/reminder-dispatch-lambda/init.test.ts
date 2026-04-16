import { PostgresDbClient } from "../lib/db/db-client";
import { postgresConfigFromEnv } from "../lib/db/db-config";
import { NotificationAuditDbClient } from "../lib/db/notification-audit-db-client";
import { OrderDbClient } from "../lib/db/order-db-client";
import { OrderStatusService } from "../lib/db/order-status-db";
import { PatientDbClient } from "../lib/db/patient-db-client";
import { AwsSecretsClient } from "../lib/secrets/secrets-manager-client";
import { AWSSQSClient } from "../lib/sqs/sqs-client";
import { testComponentCreationOrder } from "../lib/test-utils/component-integration-helpers";
import { restoreEnvironment, setupEnvironment } from "../lib/test-utils/environment-test-helpers";
import { buildEnvironment as init } from "./init";
import { DispatchedReminderMessageBuilder } from "./services/dispatched-reminder-message-builder";
import { OrderStatusReminderDbClient } from "./services/order-status-reminder-db-client";
import { ReminderNotifyService } from "./services/reminder-notify-service";

jest.mock("../lib/db/order-status-db");
jest.mock("./services/order-status-reminder-db-client");
jest.mock("../lib/db/patient-db-client");
jest.mock("../lib/db/order-db-client");
jest.mock("../lib/db/notification-audit-db-client");
jest.mock("../lib/db/db-client");
jest.mock("../lib/secrets/secrets-manager-client");
jest.mock("../lib/sqs/sqs-client");
jest.mock("../lib/db/db-config");
jest.mock("./services/reminder-notify-service");
jest.mock("./services/dispatched-reminder-message-builder");

describe("init", () => {
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
    REMINDER_ENABLED_STATUSES: '["DISPATCHED"]',
    REMINDER_INTERVAL_CONFIG:
      '{"DISPATCHED":[{"interval":7,"eventCode":"DISPATCHED_INITIAL_REMINDER"}]}',
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
    it("should return an Environment object with all required properties", () => {
      const result = init();

      expect(result).toEqual({
        reminderNotifyService: expect.any(ReminderNotifyService),
        orderStatusReminderDbClient: expect.any(OrderStatusReminderDbClient),
        enabledReminderStatuses: expect.any(Set),
        reminderConfiguration: expect.any(Object),
      });
    });

    it("should create AwsSecretsClient with AWS_REGION when set", () => {
      process.env.AWS_REGION = "us-east-1";

      init();

      expect(AwsSecretsClient).toHaveBeenCalledWith("us-east-1");
    });

    it("should throw when AWS_REGION is not set", () => {
      delete process.env.AWS_REGION;

      expect(() => init()).toThrow("Missing value for an environment variable AWS_REGION");
    });

    it("should throw when NOTIFY_MESSAGES_QUEUE_URL is not set", () => {
      delete process.env.NOTIFY_MESSAGES_QUEUE_URL;

      expect(() => init()).toThrow(
        "Missing value for an environment variable NOTIFY_MESSAGES_QUEUE_URL",
      );
    });

    it("should throw when HOME_TEST_BASE_URL is not set", () => {
      delete process.env.HOME_TEST_BASE_URL;

      expect(() => init()).toThrow("Missing value for an environment variable HOME_TEST_BASE_URL");
    });

    it("should create PostgresDbClient with correct configuration", () => {
      init();

      expect(PostgresDbClient).toHaveBeenCalledWith(mockPostgresConfig);
    });
  });

  describe("integration of components", () => {
    it("should call postgresConfigFromEnv with AwsSecretsClient instance", () => {
      init();

      expect(postgresConfigFromEnv).toHaveBeenCalledWith(expect.any(AwsSecretsClient));
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
            mock: OrderStatusService as jest.Mock,
            times: 1,
            calledWith: expect.any(PostgresDbClient),
          },
          {
            mock: OrderStatusReminderDbClient as jest.Mock,
            times: 1,
            calledWith: expect.any(PostgresDbClient),
          },
          {
            mock: PatientDbClient as jest.Mock,
            times: 1,
            calledWith: expect.any(PostgresDbClient),
          },
          {
            mock: OrderDbClient as jest.Mock,
            times: 1,
            calledWith: expect.any(PostgresDbClient),
          },
          {
            mock: NotificationAuditDbClient as jest.Mock,
            times: 1,
            calledWith: expect.any(PostgresDbClient),
          },
          {
            mock: AWSSQSClient as jest.Mock,
            times: 1,
          },
          {
            mock: ReminderNotifyService as jest.Mock,
            times: 1,
          },
        ],
      });
    });

    it("should create ReminderNotifyService with notification dependencies", () => {
      init();

      expect(ReminderNotifyService).toHaveBeenCalledWith(
        expect.objectContaining({
          notifyMessageBuilders: {
            DISPATCHED: expect.any(DispatchedReminderMessageBuilder),
          },
          orderStatusService: expect.any(OrderStatusService),
          notificationAuditDbClient: expect.any(NotificationAuditDbClient),
          sqsClient: expect.any(AWSSQSClient),
          notifyMessagesQueueUrl: "https://example.queue.local/notify",
        }),
      );
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
