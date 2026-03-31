import { ConsoleCommons } from "../lib/commons";
import { PostgresDbClient } from "../lib/db/db-client";
import { postgresConfigFromEnv } from "../lib/db/db-config";
import { SupplierService } from "../lib/db/supplier-db";
import { AwsSecretsClient } from "../lib/secrets/secrets-manager-client";
import { restoreEnvironment, setupEnvironment } from "../lib/test-utils/environment-test-helpers";
import { buildEnvironment as init } from "./init";
import { LaLookupService } from "./la-lookup";

jest.mock("../lib/db/db-client");
jest.mock("../lib/db/supplier-db");
jest.mock("../lib/secrets/secrets-manager-client");
jest.mock("./la-lookup");
jest.mock("../lib/commons");
jest.mock("../lib/db/db-config");

describe("eligibility-lookup-lambda init", () => {
  const originalEnv = process.env;

  const mockEnvVariables = {
    DB_USERNAME: "app_user",
    DB_ADDRESS: "postgres-db",
    DB_PORT: "5432",
    DB_NAME: "local_hometest_db",
    DB_SCHEMA: "hometest",
    DB_SECRET_NAME: "postgres-db-password",
    AWS_REGION: "eu-west-2",
  };

  const mockPostgresConfig = {
    user: "test-user",
    host: "test-host",
    port: 5432,
    database: "test-db",
    password: () => "test-password",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    setupEnvironment(mockEnvVariables);
    (postgresConfigFromEnv as jest.Mock).mockReturnValue(mockPostgresConfig);
  });

  afterEach(() => {
    restoreEnvironment(originalEnv);
  });

  it("should initialize all components with correct configuration", () => {
    const result = init();

    expect(result).toHaveProperty("commons");
    expect(result).toHaveProperty("supplierDb");
    expect(result).toHaveProperty("laLookupService");
    expect(result.commons).toBeInstanceOf(ConsoleCommons);
    expect(result.supplierDb).toBeInstanceOf(SupplierService);
    expect(result.laLookupService).toBeInstanceOf(LaLookupService);
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
    init();

    expect(PostgresDbClient).toHaveBeenCalledWith(mockPostgresConfig);
  });

  it("should create SupplierService with PostgresDbClient instance", () => {
    init();

    expect(SupplierService).toHaveBeenCalledWith({ dbClient: expect.any(PostgresDbClient) });
  });

  it("should return an Environment object with all required properties", () => {
    const result = init();

    expect(result).toEqual({
      commons: expect.any(ConsoleCommons),
      supplierDb: expect.any(SupplierService),
      laLookupService: expect.any(LaLookupService),
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
