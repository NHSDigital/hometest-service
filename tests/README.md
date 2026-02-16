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

3. Set up local user credentials (for local testing only):

   ```bash
   cp users.ts.example users.ts
   ```

   Then edit `users.ts` and replace the placeholder values with your actual test user credentials:
   - `email`: Your test email address
   - `nhsNumber`: Your test NHS number
   - `odsCode`: Your ODS code
   - `age`: User age
   - `patientId`: Your patient ID

   **Note**: The `users.ts` file is gitignored, so your credentials remain private. This configuration is only used when `ENV=local`.

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

```tree
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

### Environment Configuration

The framework uses environment-based configuration management. You **must** set the `ENV` environment variable before running tests.

#### Available Environments

- `dev` - Development environment
- `staging` - Staging environment

#### Required Environment Variable

Set the `ENV` variable to specify which environment to test against:

```bash
# Linux/macOS
export ENV=dev
npm test

# Or inline
ENV=dev npm test

# Windows (PowerShell)
$env:ENV="dev"
npm test
```

**If `ENV` is not set, tests will fail with an error.**

#### Environment Files

Environment-specific configuration is stored in `configuration/.env.<environment>`:

- `.env.dev` - Development configuration
- `.env.staging` - Staging configuration
- `.env.production` - Production configuration

Each file contains:

- `UI_BASE_URL` - Base URL for UI tests
- `API_BASE_URL` - Base URL for API tests
- `HEADLESS` - Run browser in headless mode (true/false)
- `TIMEOUT` - Default timeout in milliseconds
- `SLOW_MO` - Slow down operations by specified milliseconds

#### Using Configuration in Tests

Configuration is available through fixtures:

```typescript
import { test, expect } from '../fixtures';
import { EnvironmentVariables } from '../configuration';

test('example test', async ({ config }) => {
  const baseUrl = config.get(EnvironmentVariables.UI_BASE_URL);
  const headless = config.getBoolean(EnvironmentVariables.HEADLESS);
  const timeout = config.getNumber(EnvironmentVariables.TIMEOUT);

  console.log(`Testing on: ${baseUrl}`);
  console.log(`Current environment: ${config.getEnvironment()}`);
});
```

#### Adding New Configuration Variables

1. Add the key to `EnvironmentVariables` enum in `configuration/environment-variables.ts`
2. Add the variable to all `.env.*` files in `configuration/` directory
3. Optionally add a default value in the `Configuration` class constructor
4. Access the value using `config.get(EnvironmentVariables.YOUR_KEY)`

### Playwright Configuration

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
