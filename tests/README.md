# Playwright Test Framework

This directory contains the Playwright test framework for the hometest-service project.

## Setup

1. Install dependencies:

   ```bash
   cd test
   npm install
   npx playwright install
   ```

2. Install browser binaries (if needed):


   ```bash
   npx playwright install chromium firefox webkit
   ```

## Running Tests

- Run all tests:

  ```bash
  npm test
  ```

- Run tests in headed mode (with browser UI):

  ```bash
  npm run test:headed
  ```

- Run tests in debug mode:

  ```bash
  npm run test:debug
  ```

- Run tests with UI mode:

  ```bash
  npm run test:ui
  ```

- Show test report:

  ```bash
  npm run test:report
  ```

- Generate test code:

  ```bash
  npm run test:codegen
  ```

## Project Structure

```
test/
├── package.json           # Node.js dependencies and scripts
├── playwright.config.ts   # Playwright configuration
├── tests/                 # Test files
│   └── example.spec.ts    # Example test suite
├── test-results/          # Test results (generated)
└── README.md              # This file
```

## Writing Tests

Tests should be placed in the `tests/` directory with the `.spec.ts` extension.

Example test structure:

```typescript
import { test, expect } from '@playwright/test';

test.describe('My Test Suite', () => {
  test('my test case', async ({ page }) => {
    await page.goto('https://example.com');
    await expect(page).toHaveTitle(/Example/);
  });
});
```

## Configuration

The Playwright configuration is in [playwright.config.ts](playwright.config.ts). You can modify:

- `baseURL`: Set the base URL for your application
- `testDir`: Change the test directory
- `projects`: Add or remove browser configurations
- `webServer`: Configure local dev server to start before tests

## CI/CD Integration

The configuration automatically adjusts for CI environments:
- Retries: 2 retries on CI, 0 locally
- Workers: 1 worker on CI, unlimited locally
- ForbidOnly: Fails build if `test.only` is found in CI

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)
- [Best Practices](https://playwright.dev/docs/best-practices)
