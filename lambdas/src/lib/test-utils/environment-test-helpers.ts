/**
 * Shared test utilities for environment variable testing
 */

/**
 * Setup environment with mock variables
 * @param mockEnvVariables - Object containing environment variables to set
 * @returns The original environment for restoration
 */
export function setupEnvironment(
  mockEnvVariables: Record<string, string>,
): NodeJS.ProcessEnv {
  const originalEnv = process.env;
  process.env = { ...originalEnv };
  Object.assign(process.env, mockEnvVariables);
  return originalEnv;
}

/**
 * Restore the original environment
 * @param originalEnv - The original environment to restore
 */
export function restoreEnvironment(originalEnv: NodeJS.ProcessEnv): void {
  process.env = originalEnv;
}

/**
 * Test configuration for environment variable validation
 */
export interface EnvVarTestConfig {
  /** Array of environment variable names to test */
  envVars: string[];
  /** Function to execute that should throw when env var is missing/empty */
  testFn: () => void;
  /** Optional custom error message template */
  errorMessage?: (envVar: string) => string;
}

/**
 * Default error message for missing/empty environment variables
 */
const defaultErrorMessage = (envVar: string) =>
  `Missing value for an environment variable ${envVar}`;

/**
 * Test that function throws when environment variables are missing
 * Creates it.each test cases for missing environment variables
 */
export function testMissingEnvVars(config: EnvVarTestConfig): void {
  const { envVars, testFn, errorMessage = defaultErrorMessage } = config;

  it.each(envVars.map((v) => [v]))(
    "should throw error when %s is missing",
    (envVar: string) => {
      delete process.env[envVar];
      expect(() => testFn()).toThrow(errorMessage(envVar));
    },
  );
}

/**
 * Test that function throws when environment variables are empty
 * Creates it.each test cases for empty environment variables
 */
export function testEmptyEnvVars(config: EnvVarTestConfig): void {
  const { envVars, testFn, errorMessage = defaultErrorMessage } = config;

  it.each(envVars.map((v) => [v]))(
    "should throw error when %s is empty",
    (envVar: string) => {
      process.env[envVar] = "";
      expect(() => testFn()).toThrow(errorMessage(envVar));
    },
  );
}
