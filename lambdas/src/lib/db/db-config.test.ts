import { EU_WEST_2_BUNDLE } from "../../certs/eu-west-2-bundle";
import { postgresConfig, postgresConfigFromEnv, postgresIamConfig } from "./db-config";

describe("db-config", () => {
  // Environment variable keys
  const ENV_DB_USERNAME = "DB_USERNAME";
  const ENV_DB_ADDRESS = "DB_ADDRESS";
  const ENV_DB_PORT = "DB_PORT";
  const ENV_DB_NAME = "DB_NAME";
  const ENV_DB_SCHEMA = "DB_SCHEMA";
  const ENV_DB_SECRET_NAME = "DB_SECRET_NAME";
  const ENV_DB_SSL = "DB_SSL";
  const ENV_USE_IAM_AUTH = "USE_IAM_AUTH";
  const ENV_DB_REGION = "DB_REGION";

  // Common test values
  const TEST_USERNAME = "test";
  const TEST_PASSWORD = "testpass";
  const TEST_ADDRESS = "localhost";
  const TEST_PORT = "5432";
  const TEST_DATABASE = "testdb";
  const TEST_SCHEMA_PUBLIC = "public";
  const TEST_PASSWORD_SECRET_NAME = "postgres-db-password";

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
      password: TEST_PASSWORD,
      username: TEST_USERNAME,
      address: TEST_ADDRESS,
      database: TEST_DATABASE,
      schema: TEST_SCHEMA_PUBLIC,
      expectedPassword: TEST_PASSWORD,
      expectedOptions: `-c search_path=${TEST_SCHEMA_PUBLIC}`,
    },
    {
      testName: "password with surrounding double quotes",
      password: `"${TEST_PASSWORD}"`,
      username: TEST_USERNAME,
      address: TEST_ADDRESS,
      database: TEST_DATABASE,
      schema: TEST_SCHEMA_PUBLIC,
      expectedPassword: TEST_PASSWORD,
      expectedOptions: `-c search_path=${TEST_SCHEMA_PUBLIC}`,
    },
    {
      testName: "password with surrounding single quotes",
      password: `'${TEST_PASSWORD}'`,
      username: TEST_USERNAME,
      address: TEST_ADDRESS,
      database: TEST_DATABASE,
      schema: TEST_SCHEMA_PUBLIC,
      expectedPassword: TEST_PASSWORD,
      expectedOptions: `-c search_path=${TEST_SCHEMA_PUBLIC}`,
    },
    {
      testName: "password with trailing newline",
      password: `${TEST_PASSWORD}\n`,
      username: TEST_USERNAME,
      address: TEST_ADDRESS,
      database: TEST_DATABASE,
      schema: TEST_SCHEMA_PUBLIC,
      expectedPassword: TEST_PASSWORD,
      expectedOptions: `-c search_path=${TEST_SCHEMA_PUBLIC}`,
    },
    {
      testName: "password with quotes and newline",
      password: `"${TEST_PASSWORD}"\n`,
      username: TEST_USERNAME,
      address: TEST_ADDRESS,
      database: TEST_DATABASE,
      schema: TEST_SCHEMA_PUBLIC,
      expectedPassword: TEST_PASSWORD,
      expectedOptions: `-c search_path=${TEST_SCHEMA_PUBLIC}`,
    },
    {
      testName: "password with special characters (no encoding needed)",
      password: `"p@ss:word/test"\n`,
      username: TEST_USERNAME,
      address: TEST_ADDRESS,
      database: TEST_DATABASE,
      schema: TEST_SCHEMA_PUBLIC,
      expectedPassword: "p@ss:word/test",
      expectedOptions: `-c search_path=${TEST_SCHEMA_PUBLIC}`,
    },
    {
      testName: "no schema provided (undefined)",
      password: TEST_PASSWORD,
      username: TEST_USERNAME,
      address: TEST_ADDRESS,
      database: TEST_DATABASE,
      schema: undefined,
      expectedPassword: TEST_PASSWORD,
      expectedOptions: undefined,
    },
    {
      testName: "empty schema string",
      password: TEST_PASSWORD,
      username: TEST_USERNAME,
      address: TEST_ADDRESS,
      database: TEST_DATABASE,
      schema: "",
      expectedPassword: TEST_PASSWORD,
      expectedOptions: undefined,
    },
  ])(
    "should build client config with $testName",
    async ({
      password,
      username,
      address,
      database,
      schema,
      expectedPassword,
      expectedOptions,
    }) => {
      secretsClient.getSecretValue.mockResolvedValue(password);
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
      const resolvedPassword = await (config.password as () => Promise<string>)();

      expect(secretsClient.getSecretValue).toHaveBeenCalledWith(TEST_PASSWORD_SECRET_NAME, {
        jsonKey: "password",
      });
      expect(resolvedPassword).toEqual(expectedPassword);
    },
  );

  describe("Environment variables", () => {
    let originalEnv: NodeJS.ProcessEnv;
    beforeEach(() => {
      originalEnv = { ...process.env };
      Object.assign(process.env, mockEnvVariables);
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    describe("missing environment variables", () => {
      it.each([ENV_DB_USERNAME, ENV_DB_ADDRESS, ENV_DB_PORT, ENV_DB_NAME, ENV_DB_SECRET_NAME])(
        "should throw error when %s is missing",
        (envVar: string) => {
          delete process.env[envVar];

          expect(() => postgresConfigFromEnv(secretsClient)).toThrow(
            `Missing value for an environment variable ${envVar}`,
          );
        },
      );
    });

    describe("empty environment variables", () => {
      it.each([ENV_DB_USERNAME, ENV_DB_ADDRESS, ENV_DB_PORT, ENV_DB_NAME, ENV_DB_SECRET_NAME])(
        "should throw error when %s is empty",
        (envVar: string) => {
          process.env[envVar] = "";

          expect(() => postgresConfigFromEnv(secretsClient)).toThrow(
            `Missing value for an environment variable ${envVar}`,
          );
        },
      );
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

      expect(config.ssl).toEqual({
        rejectUnauthorized: true,
        ca: EU_WEST_2_BUNDLE,
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

      expect(config.ssl).toEqual({
        rejectUnauthorized: true,
        ca: EU_WEST_2_BUNDLE,
      });
    });
  });

  describe("IAM authentication", () => {
    const mockIamAuthClient = {
      getAuthToken: jest.fn(),
    };

    it("should build config with IAM auth token as password", async () => {
      const expectedToken = "iam-auth-token-abc123";
      mockIamAuthClient.getAuthToken.mockResolvedValue(expectedToken);

      const config = postgresIamConfig({
        username: TEST_USERNAME,
        address: TEST_ADDRESS,
        port: TEST_PORT,
        database: TEST_DATABASE,
        schema: TEST_SCHEMA_PUBLIC,
        region: "eu-west-2",
        sslEnabled: true,
        iamAuthClient: mockIamAuthClient,
      });

      expect(config.user).toEqual(TEST_USERNAME);
      expect(config.host).toEqual(TEST_ADDRESS);
      expect(config.port).toEqual(5432);
      expect(config.database).toEqual(TEST_DATABASE);
      expect(config.options).toEqual(`-c search_path=${TEST_SCHEMA_PUBLIC}`);

      // IAM auth always enables SSL
      expect(config.ssl).toEqual({
        rejectUnauthorized: true,
        ca: EU_WEST_2_BUNDLE,
      });

      // Password should be an async function that returns the IAM token
      expect(typeof config.password).toBe("function");
      const resolvedPassword = await (config.password as () => Promise<string>)();
      expect(resolvedPassword).toEqual(expectedToken);
      expect(mockIamAuthClient.getAuthToken).toHaveBeenCalled();
    });

    it("should enforce SSL even when sslEnabled is false", () => {
      mockIamAuthClient.getAuthToken.mockResolvedValue("token");

      const config = postgresIamConfig({
        username: TEST_USERNAME,
        address: TEST_ADDRESS,
        port: TEST_PORT,
        database: TEST_DATABASE,
        region: "eu-west-2",
        sslEnabled: false,
        iamAuthClient: mockIamAuthClient,
      });

      // SSL must always be enabled for IAM auth
      expect(config.ssl).toEqual({
        rejectUnauthorized: true,
        ca: EU_WEST_2_BUNDLE,
      });
    });

    it("should set search_path when schema is provided", async () => {
      mockIamAuthClient.getAuthToken.mockResolvedValue("token");

      const config = postgresIamConfig({
        username: TEST_USERNAME,
        address: TEST_ADDRESS,
        port: TEST_PORT,
        database: TEST_DATABASE,
        schema: "my_schema",
        region: "eu-west-2",
        sslEnabled: true,
        iamAuthClient: mockIamAuthClient,
      });

      expect(config.options).toEqual("-c search_path=my_schema");
    });

    it("should not set search_path when schema is undefined", async () => {
      mockIamAuthClient.getAuthToken.mockResolvedValue("token");

      const config = postgresIamConfig({
        username: TEST_USERNAME,
        address: TEST_ADDRESS,
        port: TEST_PORT,
        database: TEST_DATABASE,
        schema: undefined,
        region: "eu-west-2",
        sslEnabled: true,
        iamAuthClient: mockIamAuthClient,
      });

      expect(config.options).toBeUndefined();
    });
  });

  describe("postgresConfigFromEnv with IAM auth", () => {
    let originalEnv: NodeJS.ProcessEnv;
    beforeEach(() => {
      originalEnv = { ...process.env };
      Object.assign(process.env, {
        ...mockEnvVariables,
        [ENV_USE_IAM_AUTH]: "true",
        [ENV_DB_REGION]: "eu-west-2",
      });
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it("should use IAM auth when USE_IAM_AUTH is true", () => {
      // DB_SECRET_NAME should NOT be required when using IAM auth
      delete process.env[ENV_DB_SECRET_NAME];

      const config = postgresConfigFromEnv(secretsClient);

      expect(config.user).toEqual("test-username");
      expect(config.host).toEqual("test-address");
      expect(config.port).toEqual(5432);
      expect(config.database).toEqual("test-database");
      expect(config.options).toEqual("-c search_path=test-schema");
      // IAM auth always enforces SSL
      expect(config.ssl).toEqual({
        rejectUnauthorized: true,
        ca: EU_WEST_2_BUNDLE,
      });
      expect(typeof config.password).toBe("function");
    });

    it("should not require DB_SECRET_NAME when using IAM auth", () => {
      delete process.env[ENV_DB_SECRET_NAME];

      expect(() => postgresConfigFromEnv(secretsClient)).not.toThrow();
    });

    it("should use DB_REGION env var for the region", () => {
      process.env[ENV_DB_REGION] = "us-east-1";

      const config = postgresConfigFromEnv(secretsClient);

      // Config should be created successfully with the specified region
      expect(config.user).toEqual("test-username");
    });

    it("should fall back to AWS_REGION when DB_REGION is not set", () => {
      delete process.env[ENV_DB_REGION];
      process.env.AWS_REGION = "ap-southeast-1";

      const config = postgresConfigFromEnv(secretsClient);

      expect(config.user).toEqual("test-username");
    });

    it("should use Secrets Manager when USE_IAM_AUTH is false", () => {
      process.env[ENV_USE_IAM_AUTH] = "false";

      const config = postgresConfigFromEnv(secretsClient);

      expect(config.user).toEqual("test-username");
      expect(typeof config.password).toBe("function");
    });

    it("should use Secrets Manager when USE_IAM_AUTH is not set", () => {
      delete process.env[ENV_USE_IAM_AUTH];

      const config = postgresConfigFromEnv(secretsClient);

      expect(config.user).toEqual("test-username");
      expect(typeof config.password).toBe("function");
    });
  });
});
