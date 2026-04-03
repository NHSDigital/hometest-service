import { PostgresDbClient } from "../lib/db/db-client";
import { postgresConfigFromEnv } from "../lib/db/db-config";
import { NotificationAuditDbClient } from "../lib/db/notification-audit-db-client";
import { OrderStatusService } from "../lib/db/order-status-db";
import { PatientDbClient } from "../lib/db/patient-db-client";
import { AwsSecretsClient } from "../lib/secrets/secrets-manager-client";
import { AWSSQSClient } from "../lib/sqs/sqs-client";
import { testComponentCreationOrder } from "../lib/test-utils/component-integration-helpers";
import { restoreEnvironment, setupEnvironment } from "../lib/test-utils/environment-test-helpers";
import { buildEnvironment as init } from "./init";
import { NotifyMessageBuilder } from "./notify-message-builder";
import { OrderStatusNotifyService } from "./notify-service";

jest.mock("../lib/db/order-status-db");
jest.mock("../lib/db/patient-db-client");
jest.mock("../lib/db/notification-audit-db-client");
jest.mock("../lib/db/db-client");
jest.mock("../lib/secrets/secrets-manager-client");
jest.mock("../lib/sqs/sqs-client");
jest.mock("../lib/db/db-config");
jest.mock("./notify-message-builder");
jest.mock("./notify-service");

describe("init", () => {
  const originalEnv = process.env;

  const mockEnvVariables = {
    DB_USERNAME: "test-username",
    DB_ADDRESS: "test-address",
    DB_PORT: "5432",
    DB_NAME: "test-database",
    DB_SCHEMA: "test-schema",
    DB_SECRET_NAME: "test-secret-name",
    NOTIFY_MESSAGES_QUEUE_URL: "https://example.queue.local/notify",
    HOME_TEST_BASE_URL: "https://hometest.example.nhs.uk",
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

      expect(result).toHaveProperty("orderStatusDb");
      expect(result.orderStatusDb).toBeInstanceOf(OrderStatusService);
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

    it("should create OrderStatusService with PostgresDbClient instance", () => {
      init();

      expect(OrderStatusService).toHaveBeenCalledWith(expect.any(PostgresDbClient));
    });

    it("should return an Environment object with all required properties", () => {
      const result = init();

      expect(result).toEqual({
        orderStatusDb: expect.any(OrderStatusService),
        orderStatusNotifyService: expect.any(OrderStatusNotifyService),
      });
    });
  });

  describe("integration of components", () => {
    it("should pass a PostgresDbClient instance to OrderStatusService", () => {
      init();

      const orderStatusServiceCalls = (OrderStatusService as jest.Mock).mock.calls;
      expect(orderStatusServiceCalls[0][0]).toBeInstanceOf(PostgresDbClient);
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
            mock: PatientDbClient as jest.Mock,
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
            mock: NotifyMessageBuilder as jest.Mock,
            times: 1,
          },
          {
            mock: OrderStatusNotifyService as jest.Mock,
            times: 1,
          },
        ],
      });
    });

    it("should create NotifyMessageBuilder with PatientDbClient and home test base url", () => {
      init();

      expect(NotifyMessageBuilder).toHaveBeenCalledWith(
        expect.any(PatientDbClient),
        "https://hometest.example.nhs.uk",
      );
    });

    it("should create OrderStatusNotifyService with notification dependencies", () => {
      init();

      expect(OrderStatusNotifyService).toHaveBeenCalledWith({
        orderStatusDb: expect.any(OrderStatusService),
        notificationAuditDbClient: expect.any(NotificationAuditDbClient),
        sqsClient: expect.any(AWSSQSClient),
        notifyMessageBuilder: expect.any(NotifyMessageBuilder),
        notifyMessagesQueueUrl: "https://example.queue.local/notify",
      });
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
