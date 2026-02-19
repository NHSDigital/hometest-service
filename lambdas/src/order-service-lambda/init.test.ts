const mockPostgresDbClient = jest.fn();
const mockSupplierService = jest.fn();

jest.mock("../lib/db/db-client", () => ({
  PostgresDbClient: mockPostgresDbClient,
}));

jest.mock("../lib/db/supplier-db", () => ({
  SupplierService: mockSupplierService,
}));

import { init } from "./init";

describe("order-service-lambda init", () => {
  beforeEach(() => {
    mockPostgresDbClient.mockReset();
    mockSupplierService.mockReset();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should construct SupplierService with PostgresDbClient", () => {
    const dbClientInstance = {
      query: jest.fn(),
      withTransaction: jest.fn(),
      close: jest.fn(),
    };
    const supplierServiceInstance = { createPatientAndOrderAndStatus: jest.fn() };

    process.env.DATABASE_URL = "postgres://user:pass@host:5432/db";

    mockPostgresDbClient.mockImplementation(() => dbClientInstance);
    mockSupplierService.mockImplementation(() => supplierServiceInstance);

    const result = init();

    expect(mockPostgresDbClient).toHaveBeenCalledWith(
      "postgres://user:pass@host:5432/db",
    );
    expect(mockSupplierService).toHaveBeenCalledWith({
      dbClient: dbClientInstance,
    });
    expect(result).toEqual({ supplierService: supplierServiceInstance });
  });
});
