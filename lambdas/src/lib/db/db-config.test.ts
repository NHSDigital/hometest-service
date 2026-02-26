import { postgresConfig, postgresConfigFromEnv } from "./db-config";
import { readFileSync } from "fs";
import { join } from "path";
import {
  setupEnvironment,
  restoreEnvironment,
  testMissingEnvVars,
  testEmptyEnvVars,
} from "../test-utils/environment-test-helpers";
describe("db-config", () => {
  const mockEnvVariables = {
    DB_USERNAME: "test-username",
    DB_ADDRESS: "test-address",
    DB_PORT: "5432",
    DB_NAME: "test-database",
    DB_SCHEMA: "test-schema",
    DB_SECRET_NAME: "test-secret-name",
    DB_SSL: "false",
  };

  const secretsClient = {
    getSecretValue: jest.fn(),
    getSecretString: jest.fn(),
  };

  it.each([
    {
      testName: "clean password",
      passwordInput: "testpass",
      username: "test",
      address: "localhost",
      database: "testdb",
      schema: "public",
      expectedPassword: "testpass",
      expectedOptions: "-c search_path=public",
    },
    {
      testName: "password with surrounding double quotes",
      passwordInput: '"testpass"',
      username: "test",
      address: "localhost",
      database: "testdb",
      schema: "public",
      expectedPassword: "testpass",
      expectedOptions: "-c search_path=public",
    },
    {
      testName: "password with surrounding single quotes",
      passwordInput: "'testpass'",
      username: "test",
      address: "localhost",
      database: "testdb",
      schema: "public",
      expectedPassword: "testpass",
      expectedOptions: "-c search_path=public",
    },
    {
      testName: "password with trailing newline",
      passwordInput: "testpass\n",
      username: "test",
      address: "localhost",
      database: "testdb",
      schema: "public",
      expectedPassword: "testpass",
      expectedOptions: "-c search_path=public",
    },
    {
      testName: "password with quotes and newline",
      passwordInput: '"STRONG_APP_PASSWORD"\n',
      username: "app_user",
      address: "postgres-db",
      database: "local_hometest_db",
      schema: "hometest",
      expectedPassword: "STRONG_APP_PASSWORD",
      expectedOptions: "-c search_path=hometest",
    },
    {
      testName: "password with special characters (no encoding needed)",
      passwordInput: '"p@ss:word/test"\n',
      username: "test",
      address: "localhost",
      database: "testdb",
      schema: "public",
      expectedPassword: "p@ss:word/test",
      expectedOptions: "-c search_path=public",
    },
    {
      testName: "no schema provided (undefined)",
      passwordInput: "testpass",
      username: "test",
      address: "localhost",
      database: "testdb",
      schema: undefined,
      expectedPassword: "testpass",
      expectedOptions: undefined,
    },
    {
      testName: "empty schema string",
      passwordInput: "testpass",
      username: "test",
      address: "localhost",
      database: "testdb",
      schema: "",
      expectedPassword: "testpass",
      expectedOptions: undefined,
    },
  ])(
    "should build client config with $testName",
    async ({
      passwordInput,
      username,
      address,
      database,
      schema,
      expectedPassword,
      expectedOptions,
    }) => {
      secretsClient.getSecretValue.mockResolvedValue(passwordInput);
      const config = postgresConfig({
        username,
        address,
        port: "5432",
        database,
        schema,
        passwordSecretName: "postgres-db-password",
        secretsClient,
        sslEnabled: false,
      });

      expect(config.user).toEqual(username);
      expect(config.host).toEqual(address);
      expect(config.port).toEqual(5432);
      expect(config.database).toEqual(database);
      expect(config.options).toEqual(expectedOptions);
      expect(config.ssl).toBe(false);

      // Test password function
      expect(typeof config.password).toBe("function");
      const resolvedPassword = await (
        config.password as () => Promise<string>
      )();

      expect(secretsClient.getSecretValue).toHaveBeenCalledWith(
        "postgres-db-password",
        { jsonKey: "password" },
      );
      expect(resolvedPassword).toEqual(expectedPassword);
    },
  );

  describe("Environment variables", () => {
    let originalEnv: NodeJS.ProcessEnv;
    beforeEach(() => {
      originalEnv = setupEnvironment(mockEnvVariables);
    });

    afterEach(() => {
      restoreEnvironment(originalEnv);
    });

    describe("missing environment variables", () => {
      testMissingEnvVars({
        envVars: [
          "DB_USERNAME",
          "DB_ADDRESS",
          "DB_PORT",
          "DB_NAME",
          "DB_SECRET_NAME",
        ],
        testFn: () => postgresConfigFromEnv(secretsClient),
      });
    });

    describe("empty environment variables", () => {
      testEmptyEnvVars({
        envVars: [
          "DB_USERNAME",
          "DB_ADDRESS",
          "DB_PORT",
          "DB_NAME",
          "DB_SECRET_NAME",
        ],
        testFn: () => postgresConfigFromEnv(secretsClient),
      });
    });

    it("should create config from environment variables", () => {
      const config = postgresConfigFromEnv(secretsClient);

      expect(config.user).toEqual("test-username");
      expect(config.host).toEqual("test-address");
      expect(config.port).toEqual(5432);
      expect(config.database).toEqual("test-database");
      expect(config.options).toEqual("-c search_path=test-schema");
      expect(config.ssl).toBe(false);
      expect(typeof config.password).toBe("function");
    });

    it("should enable SSL from environment when DB_SSL is true", () => {
      process.env.DB_SSL = "true";

      const config = postgresConfigFromEnv(secretsClient);
      const certPath = join(__dirname, "../../certs/eu-west-2-bundle.pem");
      const ca = readFileSync(certPath, "utf-8");

      expect(config.ssl).toEqual({
        rejectUnauthorized: true,
        ca,
      });
    });
  });

  describe("SSL configuration", () => {
    it("should disable SSL when sslEnabled is false", () => {
      const config = postgresConfig({
        username: "test",
        address: "localhost",
        port: "5432",
        database: "testdb",
        passwordSecretName: "postgres-db-password",
        secretsClient,
        sslEnabled: false,
      });

      expect(config.ssl).toBe(false);
    });

    it("should enable SSL with cert when sslEnabled is true", () => {
      const config = postgresConfig({
        username: "test",
        address: "localhost",
        port: "5432",
        database: "testdb",
        passwordSecretName: "postgres-db-password",
        secretsClient,
        sslEnabled: true,
      });
      const certPath = join(__dirname, "../../certs/eu-west-2-bundle.pem");
      const ca = readFileSync(certPath, "utf-8");

      expect(config.ssl).toEqual({
        rejectUnauthorized: true,
        ca,
      });
    });
  });
});
