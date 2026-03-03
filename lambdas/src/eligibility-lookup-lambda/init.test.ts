const mockPostgresDbClient = jest.fn();
const mockSupplierService = jest.fn();
const mockLaLookupService = jest.fn();
const mockConsoleCommons = jest.fn();
const mockAwsSecretsClient = jest.fn();
<<<<<<< HEAD
const mockPostgresFromEnv = jest.fn();
=======
const mockPostgresConfigFromEnv = jest.fn();
>>>>>>> 8c47243a733da9c990ea007b2ad300ca1b1f0e72

jest.mock("../lib/db/db-client", () => ({
  PostgresDbClient: mockPostgresDbClient,
}));

jest.mock("../lib/db/supplier-db", () => ({
  SupplierService: mockSupplierService,
}));

jest.mock("../lib/secrets/secrets-manager-client", () => ({
  AwsSecretsClient: mockAwsSecretsClient,
}));

jest.mock("./la-lookup", () => ({
  LaLookupService: mockLaLookupService,
}));

jest.mock("../lib/commons", () => ({
  ConsoleCommons: mockConsoleCommons,
}));

<<<<<<< HEAD
jest.mock("../lib/db/connection-string-provider", () => ({
  postgresFromEnv: mockPostgresFromEnv,
=======
jest.mock("../lib/db/db-config", () => ({
  postgresConfigFromEnv: mockPostgresConfigFromEnv,
>>>>>>> 8c47243a733da9c990ea007b2ad300ca1b1f0e72
}));

// import remains here to avoid hoisting issues with jest.mock
import { init } from "./init";
describe("eligibility-lookup-lambda init", () => {
  beforeEach(() => {
    mockPostgresDbClient.mockReset();
    mockSupplierService.mockReset();
    mockLaLookupService.mockReset();
    mockConsoleCommons.mockReset();
    mockAwsSecretsClient.mockReset();

    delete process.env.DB_USERNAME;
    delete process.env.DB_ADDRESS;
    delete process.env.DB_PORT;
    delete process.env.DB_NAME;
    delete process.env.DB_SCHEMA;
    delete process.env.DB_SECRET_NAME;
    delete process.env.AWS_REGION;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should construct all services and return the environment object", () => {
    const dbClientInstance = { query: jest.fn(), close: jest.fn() };
    const supplierServiceInstance = { getSupplier: jest.fn() };
    const laLookupServiceInstance = { getByPostcode: jest.fn() };
    const commonsInstance = { log: jest.fn() };
    const secretsClientInstance = { getSecretValue: jest.fn() };
    const mockConnectionStringProvider = {
      getConnectionString: jest.fn().mockResolvedValue("postgresql://test-connection-string"),
    };


    process.env.AWS_REGION = "eu-west-2";
    process.env.DB_USERNAME = "app_user";
    process.env.DB_ADDRESS = "postgres-db";
    process.env.DB_PORT = "5432";
    process.env.DB_NAME = "local_hometest_db";
    process.env.DB_SCHEMA = "hometest";
    process.env.DB_SECRET_NAME = "postgres-db-password";
<<<<<<< HEAD
=======

    const mockConfig = {
      user: "test-user",
      host: "test-host",
      port: 5432,
      database: "test-db",
      password: jest.fn().mockResolvedValue("test-password"),
    };
>>>>>>> 8c47243a733da9c990ea007b2ad300ca1b1f0e72

    mockPostgresDbClient.mockImplementation(() => dbClientInstance);
    mockSupplierService.mockImplementation(() => supplierServiceInstance);
    mockLaLookupService.mockImplementation(() => laLookupServiceInstance);
    mockConsoleCommons.mockImplementation(() => commonsInstance);
    mockAwsSecretsClient.mockImplementation(() => secretsClientInstance);
<<<<<<< HEAD
    mockPostgresFromEnv.mockReturnValue(mockConnectionStringProvider);
=======
    mockPostgresConfigFromEnv.mockReturnValue(mockConfig);
>>>>>>> 8c47243a733da9c990ea007b2ad300ca1b1f0e72

    const result = init();

    expect(mockConsoleCommons).toHaveBeenCalled();
<<<<<<< HEAD
    expect(mockPostgresDbClient).toHaveBeenCalledWith(mockConnectionStringProvider);
=======
    expect(mockPostgresDbClient).toHaveBeenCalledWith(
      mockConfig
    );
>>>>>>> 8c47243a733da9c990ea007b2ad300ca1b1f0e72
    expect(mockSupplierService).toHaveBeenCalledWith({ dbClient: dbClientInstance });
    expect(mockLaLookupService).toHaveBeenCalled();

    expect(result).toEqual({
      commons: commonsInstance,
      supplierDb: supplierServiceInstance,
      laLookupService: laLookupServiceInstance,
    });
  });
});
