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
