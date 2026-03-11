---
applyTo: "tests/**"
---

# Test Instructions

## Overview

This workspace contains Playwright tests covering UI journeys, API endpoints, integration
scenarios, and accessibility. Tests are written by the test engineering team. Do not generate
E2E or accessibility test specs without being explicitly asked.

## Structure

```text
tests/
├── api/                    # API client classes for calling backend endpoints
├── configuration/          # Environment configuration (EnvironmentConfiguration.ts)
├── db/                     # Database helpers for test setup/teardown
├── fixtures/               # Playwright fixture definitions
│   └── CombinedTestFixture.ts  ← main fixture export for UI/E2E tests
│   └── IntegrationFixture.ts   ← fixture export for API/integration tests
├── models/                 # TypeScript interfaces for request/response payloads
├── page-objects/           # Page Object Model classes
├── test-data/              # Static test data factories
├── tests/
│   ├── ui/                 # UI journey specs
│   ├── api/                # API endpoint specs
│   ├── e2e/                # Full end-to-end journey specs
│   ├── integration/        # Integration specs
│   └── accessibility/      # Accessibility specs
└── utils/                  # Shared test utilities
```

## Importing Test and Expect

Always import `test` from the correct fixture file — **never** from `@playwright/test` directly
in test specs.

```typescript
// UI and journey tests
import { test } from "../../fixtures/CombinedTestFixture";
import { expect } from "@playwright/test";

// API / integration tests
import { test, expect } from "../../fixtures/IntegrationFixture";
```

`CombinedTestFixture` merges: `pageObjectFixture`, `configurationFixture`, `apiFixture`,
`accessibilityFixture`, `storageStateFixture`, `consoleErrorFixture`.

## Configuration

Access environment configuration via `ConfigFactory`:

```typescript
// From page-objects/ or fixtures/ (one level deep)
import { ConfigFactory, type ConfigInterface } from "../configuration/EnvironmentConfiguration";

// From tests/tests/**/* (two levels deep)
import { ConfigFactory, type ConfigInterface } from "../../configuration/EnvironmentConfiguration";

const config: ConfigInterface = ConfigFactory.getConfig();
const baseUrl = config.uiBaseUrl;
const apiUrl = config.apiBaseUrl;
```

Do **not** use `config.get(EnvironmentVariables.X)` — that pattern is not in use. The
`ConfigInterface` provides typed properties directly (`uiBaseUrl`, `apiBaseUrl`, `headless`,
`timeout`, etc.).

The `ENV` environment variable selects the configuration layer. Valid values: `local`, `dev`.

## Page Object Model

All page interactions go through Page Object classes. Every page has its own class in
`page-objects/` extending `BasePage`.

```typescript
// Page objects live in tests/page-objects/ — one level from tests/configuration/
import { Locator, Page } from "@playwright/test";
import { ConfigFactory } from "../configuration/EnvironmentConfiguration";
import { BasePage } from "./BasePage";

export class ExamplePage extends BasePage {
  readonly submitButton: Locator;
  readonly errorSummary: Locator;

  constructor(page: Page) {
    super(page);
    this.submitButton = page.getByRole("button", { name: "Continue" });
    this.errorSummary = page.getByRole("alert");
  }

  async navigate(): Promise<void> {
    const config = ConfigFactory.getConfig();
    await this.page.goto(`${config.uiBaseUrl}/your-route-path`);
  }

  async clickContinue(): Promise<void> {
    await this.submitButton.click();
  }
}
```

Rules:

- All locators are `readonly` class properties, defined in the constructor.
- All interaction methods are `async` and return `Promise<void>` (or typed return when needed).
- Use `BasePage.waitUntilPageLoad()`, `getHeaderText()`, `clickBackLink()` as provided.
- Add the new page object to `pageObjectsFixture.ts` so it is available in all tests.

## Locator Strategy

Prefer locators in this order:

1. `page.getByRole()` — most resilient and accessible
2. `page.getByLabel()` — for form inputs
3. `page.getByText()` — for visible text content
4. `page.getByTestId()` — for `data-testid` attributes
5. `page.locator()` with CSS — last resort only

```typescript
// Preferred
page.getByRole("button", { name: "Start now" });
page.getByRole("link", { name: "Back" });
page.getByLabel("Date of birth");

// Avoid
page.locator("#start-button");
page.locator(".nhsuk-button");
```

## Test File Conventions

- All spec files use the `.spec.ts` extension.
- Use `test.describe()` to group related scenarios.
- Tag tests using the `{ tag: "@<scope>" }` option: `@ui`, `@api`, `@integration`,
  `@accessibility`, `@e2e`.
- Test names describe the expected outcome, not the implementation.

```typescript
import { test } from "../../fixtures/CombinedTestFixture";
import { expect } from "@playwright/test";

test.describe("Order journey — delivery address", { tag: "@ui" }, () => {
  test.beforeEach(async ({ homeTestStartPage }) => {
    await homeTestStartPage.navigate();
    await homeTestStartPage.clickStartNowButton();
  });

  test("user can enter a delivery address manually", async ({ enterDeliveryAddressPage }) => {
    // arrange + act + assert
  });
});
```

## API Tests

API tests use `IntegrationFixture` and make real HTTP calls to the backend. Always clean up
any data created during a test in `afterEach`.

```typescript
import { test, expect } from "../../fixtures/IntegrationFixture";

test.describe("Order creation endpoint", { tag: "@api" }, () => {
  let createdOrderUid: string;

  test("POST /order — creates an order and returns 201", async ({ orderApi }) => {
    const response = await orderApi.createOrder(payload, headers);
    expect(response.status()).toBe(201);
    createdOrderUid = (await response.json()).orderUid;
  });

  test.afterEach(async ({ testOrderDb }) => {
    if (createdOrderUid) {
      await testOrderDb.deleteOrderByUid(createdOrderUid);
    }
  });
});
```

## Accessibility & E2E Tests

Accessibility and E2E specs are owned by the test engineering team. Do not generate
`tests/tests/accessibility/` or `tests/tests/e2e/` files unless explicitly asked.
