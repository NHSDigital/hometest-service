const mockPostgresDbClient = jest.fn();
const mockSupplierService = jest.fn();
const mockLaLookupService = jest.fn();
const mockConsoleCommons = jest.fn();

jest.mock("../lib/db/db-client", () => ({
  PostgresDbClient: mockPostgresDbClient,
}));

jest.mock("../lib/db/supplier-db", () => ({
  SupplierService: mockSupplierService,
}));

jest.mock("./la-lookup", () => ({
  LaLookupService: mockLaLookupService,
}));

jest.mock("../lib/commons", () => ({
  ConsoleCommons: mockConsoleCommons,
}));

import { init } from "./init";

describe("eligibility-lookup-lambda init", () => {
  beforeEach(() => {
    mockPostgresDbClient.mockReset();
    mockSupplierService.mockReset();
    mockLaLookupService.mockReset();
    mockConsoleCommons.mockReset();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should construct all services and return the environment object", () => {
    const dbClientInstance = { query: jest.fn(), close: jest.fn() };
    const supplierServiceInstance = { getSupplier: jest.fn() };
    const laLookupServiceInstance = { getByPostcode: jest.fn() };
    const commonsInstance = { log: jest.fn() };

    process.env.DATABASE_URL = "postgres://user:pass@host:5432/db";

    mockPostgresDbClient.mockImplementation(() => dbClientInstance);
    mockSupplierService.mockImplementation(() => supplierServiceInstance);
    mockLaLookupService.mockImplementation(() => laLookupServiceInstance);
    mockConsoleCommons.mockImplementation(() => commonsInstance);

    const result = init();

    expect(mockConsoleCommons).toHaveBeenCalled();
    expect(mockPostgresDbClient).toHaveBeenCalledWith(
      "postgres://user:pass@host:5432/db"
    );
    expect(mockSupplierService).toHaveBeenCalledWith({ dbClient: dbClientInstance });
    expect(mockLaLookupService).toHaveBeenCalled();

    expect(result).toEqual({
      commons: commonsInstance,
      supplierDb: supplierServiceInstance,
      laLookupService: laLookupServiceInstance,
    });
  });
});
