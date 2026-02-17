// Jest setup file
process.env.NODE_ENV = 'test';
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
