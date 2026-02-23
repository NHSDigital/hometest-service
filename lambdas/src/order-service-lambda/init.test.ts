const mockPostgresDbClient = jest.fn();
const mockOrderStatusService = jest.fn();
const mockTransactionService = jest.fn();
const mockAwssqsClient = jest.fn();
const mockAwsSecretsClient = jest.fn();

jest.mock("../lib/db/db-client", () => ({
  PostgresDbClient: mockPostgresDbClient,
}));

jest.mock("../lib/db/order-status-db", () => ({
  OrderStatusService: mockOrderStatusService,
}));

jest.mock("../lib/db/transaction-db-client", () => ({
  TransactionService: mockTransactionService,
}));

jest.mock("../lib/sqs/sqs-client", () => ({
  AWSSQSClient: mockAwssqsClient,
}));

jest.mock("../lib/secrets/secrets-manager-client", () => ({
  AwsSecretsClient: mockAwsSecretsClient,
}));

import { init } from "./init";

describe("order-service-lambda init", () => {
  beforeEach(() => {
    mockPostgresDbClient.mockReset();
    mockOrderStatusService.mockReset();
    mockTransactionService.mockReset();
    mockAwssqsClient.mockReset();
    mockAwsSecretsClient.mockReset();
    delete process.env.DB_USERNAME;
    delete process.env.DB_ADDRESS;
    delete process.env.DB_PORT;
    delete process.env.DB_NAME;
    delete process.env.DB_SCHEMA;
    delete process.env.DB_SECRET_NAME;
    delete process.env.ORDER_PLACEMENT_QUEUE_URL;
    delete process.env.AWS_REGION;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should construct dependencies with mandatory env vars", () => {
    const dbClientInstance = {
      query: jest.fn(),
      withTransaction: jest.fn(),
      close: jest.fn(),
    };
    const orderStatusServiceInstance = {};
    const transactionServiceInstance = {};
    const sqsClientInstance = {};
    const secretsClientInstance = { getSecretValue: jest.fn() };

    process.env.AWS_REGION = "eu-west-2";
    setAllEnvVars();

    mockPostgresDbClient.mockImplementation(() => dbClientInstance);
    mockOrderStatusService.mockImplementation(() => orderStatusServiceInstance);
    mockTransactionService.mockImplementation(() => transactionServiceInstance);
    mockAwssqsClient.mockImplementation(() => sqsClientInstance);
    mockAwsSecretsClient.mockImplementation(() => secretsClientInstance);

    const result = init();

    expect(mockPostgresDbClient).toHaveBeenCalledWith(
      {
        username: "app_user",
        address: "postgres-db",
        port: "5432",
        database: "local_hometest_db",
        schema: "hometest",
        passwordSecretName: "postgres-db-password",
      },
      secretsClientInstance,
    );
    expect(mockOrderStatusService).toHaveBeenCalledWith(dbClientInstance);
    expect(mockTransactionService).toHaveBeenCalledWith({
      dbClient: dbClientInstance,
    });
    expect(mockAwssqsClient).toHaveBeenCalledWith();
    expect(result).toEqual({
      orderStatusService: orderStatusServiceInstance,
      transactionService: transactionServiceInstance,
      sqsClient: sqsClientInstance,
      orderPlacementQueueUrl:
        "https://sqs.eu-west-2.amazonaws.com/123456789012/order-placement",
    });
  });

  describe.each([
    ["DB_USERNAME"],
    ["DB_ADDRESS"],
    ["DB_PORT"],
    ["DB_NAME"],
    ["DB_SCHEMA"],
    ["DB_SECRET_NAME"],
    ["ORDER_PLACEMENT_QUEUE_URL"],
  ])("should throw when %s is missing", (missingVar) => {
    it(`throws when ${missingVar} is missing`, () => {
      // Set all mandatory env vars
      setAllEnvVars();

      // Delete the one under test
      delete process.env[missingVar];

      expect(() => init()).toThrow(
        `Missing value for an environment variable ${missingVar}`,
      );
    });
  });
});

// Helper for setting all mandatory env vars
function setAllEnvVars() {
  process.env.DB_USERNAME = "app_user";
  process.env.DB_ADDRESS = "postgres-db";
  process.env.DB_PORT = "5432";
  process.env.DB_NAME = "local_hometest_db";
  process.env.DB_SCHEMA = "hometest";
  process.env.DB_SECRET_NAME = "postgres-db-password";
  process.env.ORDER_PLACEMENT_QUEUE_URL =
    "https://sqs.eu-west-2.amazonaws.com/123456789012/order-placement";
}
