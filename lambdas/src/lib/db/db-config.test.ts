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
  // Environment variable keys
  const ENV_DB_USERNAME = "DB_USERNAME";
  const ENV_DB_ADDRESS = "DB_ADDRESS";
  const ENV_DB_PORT = "DB_PORT";
  const ENV_DB_NAME = "DB_NAME";
  const ENV_DB_SCHEMA = "DB_SCHEMA";
  const ENV_DB_SECRET_NAME = "DB_SECRET_NAME";
  const ENV_DB_SSL = "DB_SSL";

  // Common test values
  const TEST_USERNAME = "test";
  const TEST_ADDRESS = "localhost";
  const TEST_PORT = "5432";
  const TEST_DATABASE = "testdb";
  const TEST_SCHEMA_PUBLIC = "public";
  const TEST_PASSWORD_SECRET_NAME = "postgres-db";
  const CERT_PATH = "../../certs/eu-west-2-bundle.pem";

  const mockEnvVariables = {
    [ENV_DB_USERNAME]: "test-username",
    [ENV_DB_ADDRESS]: "test-address",
    [ENV_DB_PORT]: TEST_PORT,
    [ENV_DB_NAME]: "test-database",
    [ENV_DB_SCHEMA]: "test-schema",
    [ENV_DB_SECRET_NAME]: "test-secret-name",
    [ENV_DB_SSL]: "false",
  };

  const secretsClient = {
    getSecretValue: jest.fn(),
    getSecretString: jest.fn(),
  };

  it.each([
    {
      testName: "clean password",
      pwordInput: TEST_USERNAME,
      username: TEST_USERNAME,
      address: TEST_ADDRESS,
      database: TEST_DATABASE,
      schema: TEST_SCHEMA_PUBLIC,
      expectedPword: TEST_USERNAME,
      expectedOptions: `-c search_path=${TEST_SCHEMA_PUBLIC}`,
    },
    {
      testName: "password with surrounding double quotes",
      pwordInput: `"${TEST_USERNAME}"`,
      username: TEST_USERNAME,
      address: TEST_ADDRESS,
      database: TEST_DATABASE,
      schema: TEST_SCHEMA_PUBLIC,
      expectedPword: TEST_USERNAME,
      expectedOptions: `-c search_path=${TEST_SCHEMA_PUBLIC}`,
    },
    {
      testName: "password with surrounding single quotes",
      pwordInput: `'${TEST_USERNAME}'`,
      username: TEST_USERNAME,
      address: TEST_ADDRESS,
      database: TEST_DATABASE,
      schema: TEST_SCHEMA_PUBLIC,
      expectedPword: TEST_USERNAME,
      expectedOptions: `-c search_path=${TEST_SCHEMA_PUBLIC}`,
    },
    {
      testName: "password with trailing newline",
      pwordInput: `${TEST_USERNAME}\n`,
      username: TEST_USERNAME,
      address: TEST_ADDRESS,
      database: TEST_DATABASE,
      schema: TEST_SCHEMA_PUBLIC,
      expectedPword: TEST_USERNAME,
      expectedOptions: `-c search_path=${TEST_SCHEMA_PUBLIC}`,
    },
    {
      testName: "password with quotes and newline",
      pwordInput: '"TEST"\n',
      username: TEST_USERNAME,
      address: TEST_ADDRESS,
      database: TEST_DATABASE,
      schema: TEST_SCHEMA_PUBLIC,
      expectedPword: "TEST",
      expectedOptions: `-c search_path=${TEST_SCHEMA_PUBLIC}`,
    },
    {
      testName: "password with special characters (no encoding needed)",
      pwordInput: '"t@st:word/test"\n',
      username: TEST_USERNAME,
      address: TEST_ADDRESS,
      database: TEST_DATABASE,
      schema: TEST_SCHEMA_PUBLIC,
      expectedPword: "t@st:word/test",
      expectedOptions: `-c search_path=${TEST_SCHEMA_PUBLIC}`,
    },
    {
      testName: "no schema provided (undefined)",
      pwordInput: TEST_USERNAME,
      username: TEST_USERNAME,
      address: TEST_ADDRESS,
      database: TEST_DATABASE,
      schema: undefined,
      expectedPword: TEST_USERNAME,
      expectedOptions: undefined,
    },
    {
      testName: "empty schema string",
      pwordInput: TEST_USERNAME,
      username: TEST_USERNAME,
      address: TEST_ADDRESS,
      database: TEST_DATABASE,
      schema: "",
      expectedPword: TEST_USERNAME,
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
        port: TEST_PORT,
        database,
        schema,
        passwordSecretName: TEST_PASSWORD_SECRET_NAME,
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
        TEST_PASSWORD_SECRET_NAME,
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
          ENV_DB_USERNAME,
          ENV_DB_ADDRESS,
          ENV_DB_PORT,
          ENV_DB_NAME,
          ENV_DB_SECRET_NAME,
        ],
        testFn: () => postgresConfigFromEnv(secretsClient),
      });
    });

    describe("empty environment variables", () => {
      testEmptyEnvVars({
        envVars: [
          ENV_DB_USERNAME,
          ENV_DB_ADDRESS,
          ENV_DB_PORT,
          ENV_DB_NAME,
          ENV_DB_SECRET_NAME,
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
      process.env[ENV_DB_SSL] = "true";

      const config = postgresConfigFromEnv(secretsClient);
      const certPath = join(__dirname, CERT_PATH);
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
        username: TEST_USERNAME,
        address: TEST_ADDRESS,
        port: TEST_PORT,
        database: TEST_DATABASE,
        passwordSecretName: TEST_PASSWORD_SECRET_NAME,
        secretsClient,
        sslEnabled: false,
      });

      expect(config.ssl).toBe(false);
    });

    it("should enable SSL with cert when sslEnabled is true", () => {
      const config = postgresConfig({
        username: TEST_USERNAME,
        address: TEST_ADDRESS,
        port: TEST_PORT,
        database: TEST_DATABASE,
        passwordSecretName: TEST_PASSWORD_SECRET_NAME,
        secretsClient,
        sslEnabled: true,
      });
      const certPath = join(__dirname, CERT_PATH);
      const ca = readFileSync(certPath, "utf-8");

      expect(config.ssl).toEqual({
        rejectUnauthorized: true,
        ca,
      });
    });
  });
});
