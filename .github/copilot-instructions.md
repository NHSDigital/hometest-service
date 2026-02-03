# GitHub Copilot Instructions

This document provides context for GitHub Copilot to assist with the Playwright test framework in this project.

## Project Overview

This is a Playwright-based end-to-end test framework for the hometest-service application. The framework supports UI testing, API testing, and accessibility testing.

## Technology Stack

- **Test Framework**: Playwright Test (`@playwright/test`)
- **Language**: TypeScript
- **Accessibility**: axe-core with `@axe-core/playwright` and `axe-html-reporter`
- **Environment Management**: dotenv with environment-specific configuration files

## Project Structure

```text
tests/
├── api/                    # API testing utilities
│   ├── clients/            # API client classes
│   │   ├── BaseApiClient.ts
│   │   └── UserApi.ts
│   └── endpoints.ts        # API endpoint definitions
├── configuration/          # Environment configuration
│   ├── .env.dev
│   ├── .env.staging
│   └── configuration.ts
├── fixtures/               # Playwright fixtures
│   ├── accessibilityFixture.ts
│   ├── apiFixture.ts
│   ├── configurationFixture.ts
│   ├── pageObjectsFixture.ts
│   └── index.ts
├── page-objects/           # Page Object Model classes
├── tests/                  # Test specs
│   ├── accessibility/
│   ├── api/
│   └── ui/
├── utils/                  # Utility modules
│   └── AccessibilityModule.ts
├── playwright.config.ts
└── package.json
```

## Code Conventions

### Test Files

- Test files use `.spec.ts` extension
- Import test and expect from fixtures: `import { test, expect } from '../fixtures';`
- Use `test.describe()` for grouping related tests
- Use descriptive test names that explain the expected behavior

```typescript
import { test, expect } from '../fixtures';

test.describe('Feature Name', () => {
  test('should perform expected behavior when condition', async ({ page, config, pageObjects }) => {
    // Test implementation
  });
});
```

### Page Object Model

- Each page has its own class in `page-objects/`
- Page objects receive `Page` in constructor
- Use Playwright locators as class properties
- Methods should be async and return Promise

```typescript
import { Page, Locator } from '@playwright/test';
import { config, EnvironmentVariables } from '../configuration';

export class ExamplePage {
  readonly page: Page;
  readonly headerText: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.headerText = page.locator('h1');
    this.submitButton = page.getByRole('button', { name: 'Submit' });
  }

  async navigate(): Promise<void> {
    await this.page.goto(config.get(EnvironmentVariables.UI_BASE_URL));
  }

  async clickSubmit(): Promise<void> {
    await this.submitButton.click();
  }
}
```

### Fixtures

- Custom fixtures are defined in `fixtures/` directory
- Fixtures are merged using `mergeTests()` from Playwright
- Available fixtures: `config`, `pageObjects`, `api`, `accessibility`

```typescript
import { test, expect } from '../fixtures';

test('example with fixtures', async ({ config, pageObjects, accessibility }) => {
  const baseUrl = config.get(EnvironmentVariables.UI_BASE_URL);
  await pageObjects.homePage.navigate();
  await accessibility.runAccessibilityCheck(pageObjects.homePage, 'Home Page');
});
```

### Configuration

- Use `EnvironmentVariables` enum for configuration keys
- Access config via `config.get()`, `config.getBoolean()`, `config.getNumber()`
- Environment is set via `ENV` environment variable

```typescript
import { config, EnvironmentVariables } from '../configuration';

const baseUrl = config.get(EnvironmentVariables.UI_BASE_URL);
const isHeadless = config.getBoolean(EnvironmentVariables.HEADLESS);
const timeout = config.getNumber(EnvironmentVariables.TIMEOUT);
```

### API Testing

- API clients extend `BaseApiClient`
- Use `API_ENDPOINTS` object for endpoint definitions
- API fixture provides configured client instances

```typescript
// endpoints.ts
export const API_ENDPOINTS = {
  users: {
    base: '/users',
    getUser: (id: number) => `/users/${id}`,
    createUser: '/users',
  },
} as const;

// In tests
test('api test', async ({ api }) => {
  const response = await api.userApi.getUser(1);
  expect(response.status()).toBe(200);
});
```

### Accessibility Testing

- Use `AccessibilityModule` for WCAG compliance testing
- Standards tested: WCAG 2.0 A/AA, WCAG 2.1 A/AA, WCAG 2.2 AA
- Reports are generated in `testResults/accessibility/`

```typescript
test('accessibility check', async ({ accessibility, pageObjects }) => {
  await pageObjects.homePage.navigate();
  const hasViolations = await accessibility.runAccessibilityCheck(
    pageObjects.homePage,
    'Home Page'
  );
  expect(hasViolations).toBe(false);
});
```

## Locator Best Practices

Prefer these locator strategies in order:

1. `page.getByRole()` - Most accessible and resilient
2. `page.getByText()` - For visible text content
3. `page.getByLabel()` - For form fields
4. `page.getByTestId()` - For data-testid attributes
5. `page.locator()` - CSS selectors as last resort

```typescript
// Preferred
page.getByRole('button', { name: 'Submit' });
page.getByRole('link', { name: 'Learn more' });
page.getByLabel('Email address');
page.getByTestId('submit-form');

// Avoid when possible
page.locator('#submit-btn');
page.locator('.form-button');
```

## Running Tests

```bash
# Set environment first
export ENV=dev

# Run all tests
npm test

# Run specific test file
npx playwright test tests/ui/example.spec.ts

# Run with headed browser
npm run test:headed

# Run with debug mode
npm run test:debug

# Run specific project (browser)
npx playwright test --project=chromium
```

## Browser Projects

Available browser projects in `playwright.config.ts`:

- `chromium` - Desktop Chrome
- `firefox` - Desktop Firefox
- `safari` - Desktop Safari
- `edge` - Desktop Edge
- `mobileChromium` - Pixel 5
- `mobileSafari` - iPhone 12

## Assertions

Use Playwright's built-in assertions:

```typescript
// Page assertions
await expect(page).toHaveTitle(/Expected Title/);
await expect(page).toHaveURL(/expected-path/);

// Locator assertions
await expect(locator).toBeVisible();
await expect(locator).toHaveText('Expected text');
await expect(locator).toBeEnabled();
await expect(locator).toHaveAttribute('href', '/path');

// API response assertions
expect(response.status()).toBe(200);
expect(await response.json()).toEqual(expectedData);
```

## Error Handling

- Tests automatically retry on CI (configured in playwright.config.ts)
- Use `test.fail()` for known failing tests
- Use `test.skip()` for conditionally skipping tests
- Use `test.fixme()` for tests that need fixing

```typescript
test.skip(process.env.CI === 'true', 'Skip on CI');
test.fail('Known issue: #123');
```
