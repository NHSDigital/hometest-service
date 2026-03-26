import { TextDecoder, TextEncoder } from "node:util";

import "@testing-library/jest-dom";

globalThis.TextEncoder = TextEncoder;
(globalThis as { TextDecoder: typeof TextDecoder }).TextDecoder = TextDecoder;

document.body.classList.add("nhsuk-frontend-supported");

// Suppress console output during tests (errors are expected in error-path tests)
globalThis.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  // Keep debug for troubleshooting
  debug: console.debug,
};
