const mockPostgresDbClient = jest.fn();
const mockOrderService = jest.fn();
const mockConsoleCommons = jest.fn();

jest.mock("../lib/db/db-client", () => ({
  PostgresDbClient: mockPostgresDbClient,
}));

jest.mock("../lib/db/order-db", () => ({
  OrderService: mockOrderService,
}));

jest.mock("../lib/commons", () => ({
  ConsoleCommons: mockConsoleCommons,
}));

import { init } from "./init";

describe("order-result-lambda init", () => {
  beforeEach(() => {
    mockPostgresDbClient.mockReset();
    mockOrderService.mockReset();
    mockConsoleCommons.mockReset();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should construct ConsoleCommons and OrderService with PostgresDbClient", () => {
    const dbClientInstance = { query: jest.fn(), close: jest.fn() };
    const orderServiceInstance = { updateOrderStatusAndResultStatus: jest.fn(), updateResultStatus: jest.fn(), retrieveOrderDetails: jest.fn() };
    const consoleCommonsInstance = { logInfo: jest.fn(), logError: jest.fn() };

    process.env.DATABASE_URL = "postgres://user:pass@host:5432/db";

    mockPostgresDbClient.mockImplementation(() => dbClientInstance);
    mockOrderService.mockImplementation(() => orderServiceInstance);
    mockConsoleCommons.mockImplementation(() => consoleCommonsInstance);

    const result = init();

    expect(mockPostgresDbClient).toHaveBeenCalledWith(
      "postgres://user:pass@host:5432/db",
    );
    expect(mockOrderService).toHaveBeenCalled();
    expect(mockConsoleCommons).toHaveBeenCalled();
    expect(result).toEqual({ commons: consoleCommonsInstance, orderService: orderServiceInstance });
  });
});
