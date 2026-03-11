import "@testing-library/jest-dom";

import { TextDecoder, TextEncoder } from "util";

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;

document.body.classList.add("nhsuk-frontend-supported");

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
