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
      expectedPassword: "testpass",
      expectedSuffix: "",
    },
  ])("should build connection string with $testName", async ({
    password,
    username,
    address,
    database,
    schema,
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
  })
})
