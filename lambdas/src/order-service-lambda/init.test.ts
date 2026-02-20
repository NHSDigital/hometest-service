const mockPostgresDbClient = jest.fn();
const mockOrderStatusService = jest.fn();
const mockTransactionService = jest.fn();
const mockAwssqsClient = jest.fn();

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

import { init } from "./init";

describe("order-service-lambda init", () => {
  beforeEach(() => {
    mockPostgresDbClient.mockReset();
    mockOrderStatusService.mockReset();
    mockTransactionService.mockReset();
    mockAwssqsClient.mockReset();
    delete process.env.DATABASE_URL;
    delete process.env.ORDER_PLACEMENT_QUEUE_URL;
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

    process.env.DATABASE_URL = "postgres://user:pass@host:5432/db";
    process.env.ORDER_PLACEMENT_QUEUE_URL =
      "https://sqs.eu-west-2.amazonaws.com/123456789012/order-placement";

    mockPostgresDbClient.mockImplementation(() => dbClientInstance);
    mockOrderStatusService.mockImplementation(() => orderStatusServiceInstance);
    mockTransactionService.mockImplementation(() => transactionServiceInstance);
    mockAwssqsClient.mockImplementation(() => sqsClientInstance);

    const result = init();

    expect(mockPostgresDbClient).toHaveBeenCalledWith(
      "postgres://user:pass@host:5432/db",
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

  it("should throw when order placement queue URL is missing", () => {
    process.env.DATABASE_URL = "postgres://user:pass@host:5432/db";

    expect(() => init()).toThrow(
      "Missing value for an environment variable ORDER_PLACEMENT_QUEUE_URL",
    );
  });

  it("should throw when DATABASE_URL is missing", () => {
    process.env.ORDER_PLACEMENT_QUEUE_URL =
      "https://sqs.eu-west-2.amazonaws.com/123456789012/order-placement";

    expect(() => init()).toThrow(
      "Missing value for an environment variable DATABASE_URL",
    );
  });
});
