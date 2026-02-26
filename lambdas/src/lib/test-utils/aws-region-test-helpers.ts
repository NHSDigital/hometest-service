/**
 * Shared test utilities for AWS region initialization testing
 */

/**
 * Test suite for AWS region initialization
 * Tests the behavior of region selection from environment variables
 */
export interface AwsRegionTestConfig {
  /** The initialization function that creates the AWS client */
  initFn: () => void;
  /** The mock constructor to verify was called with the region */
  mockConstructor: jest.Mock;
}

/**
 * Run standard AWS region tests
 * @param config - Configuration for the AWS region tests
 */
export function runAwsRegionTests(config: AwsRegionTestConfig): void {
  const { initFn, mockConstructor } = config;

  it("should create AwsSecretsClient with AWS_REGION when set", () => {
    process.env.AWS_REGION = "us-east-1";

    initFn();

    expect(mockConstructor).toHaveBeenCalledWith("us-east-1");
  });

  it("should create AwsSecretsClient with AWS_DEFAULT_REGION when AWS_REGION is not set", () => {
    delete process.env.AWS_REGION;
    process.env.AWS_DEFAULT_REGION = "us-west-2";

    initFn();

    expect(mockConstructor).toHaveBeenCalledWith("us-west-2");
  });

  it("should default to eu-west-2 when neither AWS_REGION nor AWS_DEFAULT_REGION is set", () => {
    delete process.env.AWS_REGION;
    delete process.env.AWS_DEFAULT_REGION;

    initFn();

    expect(mockConstructor).toHaveBeenCalledWith("eu-west-2");
  });
}

/**
 * Standard database configuration test
 * @param initFn - The initialization function
 * @param dbClientMock - The PostgresDbClient mock
 * @param expectedConfig - The expected configuration object
 */
export function testPostgresDbClientConfig(
  initFn: () => void,
  dbClientMock: jest.Mock,
  expectedConfig: unknown,
): void {
  process.env.AWS_REGION = "eu-west-2";

  initFn();

  expect(dbClientMock).toHaveBeenCalledWith(expectedConfig);
}
