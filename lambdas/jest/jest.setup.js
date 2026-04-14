// Jest setup file
process.env.NODE_ENV = "test";
// Set environment variables required for module-level initialisation (e.g. cors-configuration.ts)
process.env.ALLOW_ORIGIN = "http://localhost:3000";
// Suppress console output during tests (errors are expected in error-path tests)
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  // Keep debug for troubleshooting
  debug: console.debug,
};
