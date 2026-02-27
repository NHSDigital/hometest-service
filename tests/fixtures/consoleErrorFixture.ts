import { test as base, TestInfo, expect } from '@playwright/test';

interface ConsoleError {
  type: string;
  text: string;
  location?: string;
  timestamp: string;
}

interface NetworkError {
  url: string;
  status: number;
  statusText: string;
  method: string;
  timestamp: string;
}

interface ErrorCaptureOptions {
  /** Fail test on console errors (default: true) */
  failOnConsoleError?: boolean;
  /** Fail test on HTTP 4xx/5xx responses (default: true) */
  failOnNetworkError?: boolean;
  /** Ignore errors matching these patterns */
  ignorePatterns?: (string | RegExp)[];
  /** HTTP status codes to ignore (default: []) */
  ignoreStatusCodes?: number[];
}

interface ConsoleErrorFixture {
  consoleErrors: ConsoleError[];
  networkErrors: NetworkError[];
  errorCaptureOptions: ErrorCaptureOptions;
}

const defaultOptions: ErrorCaptureOptions = {
  failOnConsoleError: true,
  failOnNetworkError: true,
  ignorePatterns: [
    // Network transient errors
    /net::ERR_NETWORK_CHANGED/,
    /net::ERR_CONNECTION_RESET/,
    /net::ERR_INTERNET_DISCONNECTED/,
    // External NHS resources not available in test environment
    /NHSCookieConsent is not defined/,
    /nhsapp is not defined/,
    /"undefined" is not valid JSON/,
    // Next.js hydration warning - not an application issue
    /No `HydrateFallback` element provided to render during initial hydration/
  ],
  ignoreStatusCodes: []
};

function shouldIgnoreError(
  text: string,
  patterns: (string | RegExp)[]
): boolean {
  return patterns.some((pattern) => {
    if (typeof pattern === 'string') {
      return text.includes(pattern);
    }
    return pattern.test(text);
  });
}

export const consoleErrorFixture = base.extend<ConsoleErrorFixture>({
  consoleErrors: [[], { option: true }],
  networkErrors: [[], { option: true }],
  errorCaptureOptions: [defaultOptions, { option: true }],

  page: async (
    { page, consoleErrors, networkErrors, errorCaptureOptions },
    use,
    testInfo: TestInfo
  ) => {
    const options = { ...defaultOptions, ...errorCaptureOptions };
    const errors: ConsoleError[] = [];
    const netErrors: NetworkError[] = [];

    // Capture console errors and warnings
    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        const text = msg.text();
        if (!shouldIgnoreError(text, options.ignorePatterns || [])) {
          errors.push({
            type: msg.type(),
            text,
            location: msg.location()?.url,
            timestamp: new Date().toISOString()
          });
        }
      }
    });

    // Capture uncaught exceptions
    page.on('pageerror', (error) => {
      if (!shouldIgnoreError(error.message, options.ignorePatterns || [])) {
        errors.push({
          type: 'pageerror',
          text: error.message,
          location: error.stack,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Capture failed network requests (4xx, 5xx)
    page.on('response', (response) => {
      const status = response.status();
      if (status >= 400 && !options.ignoreStatusCodes?.includes(status)) {
        const url = response.url();
        if (!shouldIgnoreError(url, options.ignorePatterns || [])) {
          netErrors.push({
            url,
            status,
            statusText: response.statusText(),
            method: response.request().method(),
            timestamp: new Date().toISOString()
          });
        }
      }
    });

    await use(page);

    // After test, process captured errors
    const hasConsoleErrors = errors.length > 0;
    const hasNetworkErrors = netErrors.length > 0;

    // Add errors to fixtures for inspection
    consoleErrors.push(...errors);
    networkErrors.push(...netErrors);

    // Attach errors to test report
    if (hasConsoleErrors) {
      await testInfo.attach('console-errors', {
        body: JSON.stringify(errors, null, 2),
        contentType: 'application/json'
      });
    }

    if (hasNetworkErrors) {
      await testInfo.attach('network-errors', {
        body: JSON.stringify(netErrors, null, 2),
        contentType: 'application/json'
      });
    }

    // Build failure message if errors detected and should fail
    const failureMessages: string[] = [];

    if (hasConsoleErrors && options.failOnConsoleError) {
      failureMessages.push(
        `Console errors detected:\n${errors.map((e, i) => `  ${i + 1}. [${e.type}] ${e.text}`).join('\n')}`
      );
    }

    if (hasNetworkErrors && options.failOnNetworkError) {
      failureMessages.push(
        `Network errors detected:\n${netErrors.map((e, i) => `  ${i + 1}. ${e.method} ${e.url} => ${e.status} ${e.statusText}`).join('\n')}`
      );
    }

    // Fail the test if errors were captured
    if (failureMessages.length > 0) {
      expect.soft(false, failureMessages.join('\n\n')).toBeTruthy();
    }
  }
});
