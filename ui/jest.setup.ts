import { TextDecoder, TextEncoder } from "node:util";

import "@testing-library/jest-dom";

const createStorageMock = (): Storage => {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear: jest.fn(() => {
      store.clear();
    }),
    getItem: jest.fn((key: string) => {
      return store.has(key) ? store.get(key)! : null;
    }),
    key: jest.fn((index: number) => {
      return Array.from(store.keys())[index] ?? null;
    }),
    removeItem: jest.fn((key: string) => {
      store.delete(key);
    }),
    setItem: jest.fn((key: string, value: string) => {
      store.set(key, String(value));
    }),
  } as Storage;
};

const sessionStorageMock = createStorageMock();

Object.defineProperty(window, "sessionStorage", {
  value: sessionStorageMock,
  configurable: true,
});

beforeEach(() => {
  window.sessionStorage.clear();
});

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
