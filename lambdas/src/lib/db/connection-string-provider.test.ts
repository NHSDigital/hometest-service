import {postgresConnection, postgresFromEnv} from "./connection-string-provider";

describe('connection-string-provider', () => {

  const mockEnvVariables = {
    DB_USERNAME: "test-username",
    DB_ADDRESS: "test-address",
    DB_PORT: "5432",
    DB_NAME: "test-database",
    DB_SCHEMA: "test-schema",
    DB_SECRET_NAME: "test-secret-name",
  };

  const secretsClient = {
    getSecretValue: jest.fn(),
    getSecretString: jest.fn(),
  }

  it.each([
    {
      testName: "clean password",
      password: "testpass",
      username: "test",
      address: "localhost",
      database: "testdb",
      schema: "public",
      sslMode: undefined,
      expectedPassword: "testpass",
      expectedSuffix: "?options=-c%20search_path%3Dpublic",
    },
    {
      testName: "password with surrounding double quotes",
      password: '"testpass"',
      username: "test",
      address: "localhost",
      database: "testdb",
      schema: "public",
      sslMode: undefined,
      expectedPassword: "testpass",
      expectedSuffix: "?options=-c%20search_path%3Dpublic",
    },
    {
      testName: "password with surrounding single quotes",
      password: "'testpass'",
      username: "test",
      address: "localhost",
      database: "testdb",
      schema: "public",
      sslMode: undefined,
      expectedPassword: "testpass",
      expectedSuffix: "?options=-c%20search_path%3Dpublic",
    },
    {
      testName: "password with trailing newline",
      password: "testpass\n",
      username: "test",
      address: "localhost",
      database: "testdb",
      schema: "public",
      sslMode: undefined,
      expectedPassword: "testpass",
      expectedSuffix: "?options=-c%20search_path%3Dpublic",
    },
    {
      testName: "password with quotes and newline",
      password: '"STRONG_APP_PASSWORD"\n',
      username: "app_user",
      address: "postgres-db",
      database: "local_hometest_db",
      schema: "hometest",
      sslMode: undefined,
      expectedPassword: "STRONG_APP_PASSWORD",
      expectedSuffix: "?options=-c%20search_path%3Dhometest",
    },
    {
      testName: "password with special characters requiring URL encoding",
      password: '"p@ss:word/test"\n',
      username: "test",
      address: "localhost",
      database: "testdb",
      schema: "public",
      sslMode: undefined,
      expectedPassword: "p%40ss%3Aword%2Ftest",
      expectedSuffix: "?options=-c%20search_path%3Dpublic",
    },
    {
      testName: "no schema provided (undefined)",
      password: "testpass",
      username: "test",
      address: "localhost",
      database: "testdb",
      schema: undefined,
      sslMode: undefined,
      expectedPassword: "testpass",
      expectedSuffix: "",
    },
    {
      testName: "empty schema string",
      password: "testpass",
      username: "test",
      address: "localhost",
      database: "testdb",
      schema: "",
      sslMode: undefined,
      expectedPassword: "testpass",
      expectedSuffix: "",
    },
    {
      testName: "SSL mode require",
      password: "testpass",
      username: "test",
      address: "localhost",
      database: "testdb",
      schema: "public",
      sslMode: "require" as const,
      expectedPassword: "testpass",
      expectedSuffix: "?options=-c%20search_path%3Dpublic&sslmode=require",
    },
    {
      testName: "SSL mode disable",
      password: "testpass",
      username: "test",
      address: "localhost",
      database: "testdb",
      schema: "public",
      sslMode: "disable" as const,
      expectedPassword: "testpass",
      expectedSuffix: "?options=-c%20search_path%3Dpublic&sslmode=disable",
    },
    {
      testName: "SSL mode verify-ca",
      password: "testpass",
      username: "test",
      address: "localhost",
      database: "testdb",
      schema: "public",
      sslMode: "verify-ca" as const,
      expectedPassword: "testpass",
      expectedSuffix: "?options=-c%20search_path%3Dpublic&sslmode=verify-ca",
    },
    {
      testName: "SSL mode verify-full",
      password: "testpass",
      username: "test",
      address: "localhost",
      database: "testdb",
      schema: "public",
      sslMode: "verify-full" as const,
      expectedPassword: "testpass",
      expectedSuffix: "?options=-c%20search_path%3Dpublic&sslmode=verify-full",
    },
    {
      testName: "SSL mode without schema",
      password: "testpass",
      username: "test",
      address: "localhost",
      database: "testdb",
      schema: undefined,
      sslMode: "require" as const,
      expectedPassword: "testpass",
      expectedSuffix: "?sslmode=require",
    },
  ])("should build connection string with $testName", async ({
    password,
    username,
    address,
    database,
    schema,
    sslMode,
    expectedPassword,
    expectedSuffix,
  }) => {
    secretsClient.getSecretValue.mockResolvedValue(password);
    const connectionProvider = postgresConnection({
      username,
      address,
      port: "5432",
      database,
      schema,
      passwordSecretName: "postgres-db-password",
      sslMode,
    }, secretsClient);

    const connectionString = await connectionProvider.getConnectionString();

    expect(secretsClient.getSecretValue).toHaveBeenCalledWith(
      "postgres-db-password", { "jsonKey": "password" }
    );
    expect(connectionString).toEqual(
      `postgresql://${username}:${expectedPassword}@${address}:5432/${database}${expectedSuffix}`
    );
  });

  describe("Environment variables", () => {
    let originalEnv;
    beforeEach(() => {
      originalEnv = {...process.env};
      Object.assign(process.env, mockEnvVariables);
    })

    afterEach(() => {
      Object.assign(process.env, originalEnv);
    })

    describe("missing environment variables", () => {
      it.each([
        ["DB_USERNAME"],
        ["DB_ADDRESS"],
        ["DB_PORT"],
        ["DB_NAME"],
        ["DB_SECRET_NAME"],
      ])("should throw error when %s is missing", (envVar: string) => {
        delete process.env[envVar];

        expect(() => postgresFromEnv(secretsClient)).toThrow(
          `Missing value for an environment variable ${envVar}`,
        );
      });
    });

    describe("empty environment variables", () => {
      it.each([
        ["DB_USERNAME"],
        ["DB_ADDRESS"],
        ["DB_PORT"],
        ["DB_NAME"],
        ["DB_SECRET_NAME"],
      ])("should throw error when %s is empty", (envVar: string) => {
        process.env[envVar] = "";

        expect(() => postgresFromEnv(secretsClient)).toThrow(
          `Missing value for an environment variable ${envVar}`,
        );
      });
    });

    describe("SSL mode configuration", () => {
      it("should use default SSL mode 'require' when DB_SSL_MODE is not set", async () => {
        delete process.env.DB_SSL_MODE;
        secretsClient.getSecretValue.mockResolvedValue("testpass");

        const connectionProvider = postgresFromEnv(secretsClient);
        const connectionString = await connectionProvider.getConnectionString();

        expect(connectionString).toContain("sslmode=require");
        expect(connectionString).toBe(
          "postgresql://test-username:testpass@test-address:5432/test-database?options=-c%20search_path%3Dtest-schema&sslmode=require"
        );
      });

      it.each([
        ["disable"],
        ["require"],
        ["verify-ca"],
        ["verify-full"],
      ])("should use SSL mode '%s' when DB_SSL_MODE is set", async (sslMode) => {
        process.env.DB_SSL_MODE = sslMode;
        secretsClient.getSecretValue.mockResolvedValue("testpass");

        const connectionProvider = postgresFromEnv(secretsClient);
        const connectionString = await connectionProvider.getConnectionString();

        expect(connectionString).toContain(`sslmode=${sslMode}`);
      });

      it("should not include sslmode parameter when DB_SSL_MODE is empty string", async () => {
        process.env.DB_SSL_MODE = "";
        secretsClient.getSecretValue.mockResolvedValue("testpass");

        const connectionProvider = postgresFromEnv(secretsClient);
        const connectionString = await connectionProvider.getConnectionString();

        expect(connectionString).not.toContain("sslmode");
        expect(connectionString).toBe(
          "postgresql://test-username:testpass@test-address:5432/test-database?options=-c%20search_path%3Dtest-schema"
        );
      });
    });
  })
})
