import { postgresConfig, postgresConfigFromEnv } from "./db-config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
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
      pwordInput: "test",
      username: "test",
      address: "localhost",
      database: "testdb",
      schema: "public",
      expectedPword: "test",
      expectedOptions: "-c search_path=public",
    },
    {
      testName: "password with surrounding double quotes",
      pwordInput: '"test"',
      username: "test",
      address: "localhost",
      database: "testdb",
      schema: "public",
      expectedPword: "test",
      expectedOptions: "-c search_path=public",
    },
    {
      testName: "password with surrounding single quotes",
      pwordInput: "'test'",
      username: "test",
      address: "localhost",
      database: "testdb",
      schema: "public",
      expectedPword: "test",
      expectedOptions: "-c search_path=public",
    },
    {
      testName: "password with trailing newline",
      pwordInput: "test\n",
      username: "test",
      address: "localhost",
      database: "testdb",
      schema: "public",
      expectedPword: "test",
      expectedOptions: "-c search_path=public",
    },
    {
      testName: "password with quotes and newline",
      pwordInput: '"TEST"\n',
      username: "app_user",
      address: "postgres-db",
      database: "local_hometest_db",
      schema: "hometest",
      expectedPword: "TEST",
      expectedOptions: "-c search_path=hometest",
    },
    {
      testName: "password with special characters (no encoding needed)",
      pwordInput: '"t@st:word/test"\n',
      username: "test",
      address: "localhost",
      database: "testdb",
      schema: "public",
      expectedPword: "t@st:word/test",
      expectedOptions: "-c search_path=public",
    },
    {
      testName: "no schema provided (undefined)",
      pwordInput: "test",
      username: "test",
      address: "localhost",
      database: "testdb",
      schema: undefined,
      expectedPword: "test",
      expectedOptions: undefined,
    },
    {
      testName: "empty schema string",
      pwordInput: "test",
      username: "test",
      address: "localhost",
      database: "testdb",
      schema: "",
      expectedPword: "test",
      expectedOptions: undefined,
    },
  ])(
    "should build client config with $testName",
    async ({
      pwordInput,
      username,
      address,
      database,
      schema,
      expectedPword,
      expectedOptions,
    }) => {
      secretsClient.getSecretValue.mockResolvedValue(pwordInput);
      const config = postgresConfig({
        username,
        address,
        port: "5432",
        database,
        schema,
        passwordSecretName: "postgres-db",
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
        "postgres-db",
        { jsonKey: "password" },
      );
      expect(resolvedPassword).toEqual(expectedPword);
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
        passwordSecretName: "postgres-db",
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
        passwordSecretName: "postgres-db",
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
