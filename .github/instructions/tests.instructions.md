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
│   ├── CombinedTestFixture.ts  ← main fixture export for UI/E2E tests
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

## Shared Conventions

### Importing Test and Expect

Always import `test` from the correct fixture file — **never** from `@playwright/test` directly
in test specs.

```typescript
// Frontend (UI) tests
import { test } from "../../fixtures/CombinedTestFixture";
import { expect } from "@playwright/test";

// API and integration tests
import { test, expect } from "../../fixtures/IntegrationFixture";
```

### Configuration

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

### Test File Conventions

- All spec files use the `.spec.ts` extension.
- Use `test.describe()` to group related scenarios.
- Tag tests using the `{ tag: "@<scope>" }` option: `@ui`, `@api`, `@integration`,
  `@accessibility`, `@e2e`.
- Test names describe the expected outcome, not the implementation.

---

## API Automation

API tests live in `tests/tests/api/`. They use `IntegrationFixture` and make real HTTP calls
to the backend. Always clean up any data created during a test in `afterEach`.

### Fixture

`IntegrationFixture` merges: `configurationFixture`, `apiFixture`, `dbFixture`.

API resource classes live in `tests/api/clients/` and extend `BaseApiClient`. Each resource
class wraps one backend endpoint group (e.g. `OrderApiResource`, `HIVResultsApiResource`,
`OrderStatusApiResource`). Access them via fixture properties: `orderApi`, `hivResultsApi`,
`orderStatusApi`.

### Writing API Tests

```typescript
import { expect, test } from "../../fixtures/IntegrationFixture";
import { OrderTestData } from "../../test-data/OrderTestData";
import { headersOrder } from "../../utils/ApiRequestHelper";

test.describe("Order creation endpoint", { tag: "@api" }, () => {
  const payload = OrderTestData.getDefaultOrder();
  let createdOrderUid: string;

  test("POST /order — creates an order and returns 201", async ({ orderApi, testOrderDb }) => {
    const response = await orderApi.createOrder(payload, headersOrder);
    expect(response.status()).toBe(201);
    createdOrderUid = (await response.json()).orderUid;

    const order = await testOrderDb.getOrderByUid(createdOrderUid);
    expect(order).toBeDefined();
  });

  test.afterEach(async ({ testOrderDb }) => {
    await testOrderDb.deleteOrderByUid(createdOrderUid);
  });
});
```

### Adding a New API Resource

1. Create a class in `tests/api/clients/` extending `BaseApiClient`.
2. Reference the endpoint from `tests/api/Endpoints.ts`.
3. Expose the new resource in `apiFixture.ts`.

---

## Frontend Automation

Frontend (UI) tests live in `tests/tests/ui/`. They use `CombinedTestFixture` and drive the
browser through Page Object classes.

### Fixture

`CombinedTestFixture` merges: `pageObjectFixture`, `configurationFixture`, `apiFixture`,
`accessibilityFixture`, `storageStateFixture`, `consoleErrorFixture`.

### Page Object Model

All page interactions go through Page Object classes in `page-objects/`, each extending
`BasePage`.

```typescript
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
- All interaction methods are `async` and return `Promise<void>` (or a typed value when needed).
- Use `BasePage.waitUntilPageLoad()`, `getHeaderText()`, `clickBackLink()` as provided.
- Register the new page object in `pageObjectsFixture.ts` so it is available in all tests.

### Locator Strategy

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

### Writing Frontend Tests

```typescript
import { expect } from "@playwright/test";

import { test } from "../../fixtures/CombinedTestFixture";

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

### Accessibility & E2E Tests

Accessibility and E2E specs are owned by the test engineering team. Do not generate
`tests/tests/accessibility/` or `tests/tests/e2e/` files unless explicitly asked.

---

## Integration Automation

Integration tests live in `tests/tests/integration/`. They test multi-system flows — typically
combining direct database setup with real HTTP calls to verify end-to-end behaviour within the
backend (e.g. result ingestion triggering order status updates).

### Fixture

Integration tests use `CombinedTestFixture` (for `testedUser` and DB state) alongside API
resource fixtures. DB clients (`TestOrderDbClient`, `TestResultDbClient`) are instantiated
directly in the test file and connected via `beforeAll`.

### Writing Integration Tests

```typescript
import { randomUUID } from "crypto";

import { expect } from "@playwright/test";

import { TestOrderDbClient } from "../../db/TestOrderDbClient";
import { test } from "../../fixtures/CombinedTestFixture";
import { OrderBuilder } from "../../test-data/OrderBuilder";
import { headersTestResults } from "../../utils/ApiRequestHelper";

const dbClient = new TestOrderDbClient();

test.describe("Results flow — order status update", { tag: "@integration" }, () => {
  let orderId: string;

  test.beforeAll(async () => {
    await dbClient.connect();
  });

  test.beforeEach(async ({ testedUser }) => {
    const result = await dbClient.createOrderWithPatientAndStatus(
      new OrderBuilder().withUser(testedUser).withSupplier("Preventx").build(),
    );
    orderId = result.order_uid;
  });

  test("order status becomes COMPLETE when a normal result is submitted", async ({
    hivResultsApi,
  }) => {
    const correlationId = randomUUID();
    const response = await hivResultsApi.submitTestResults(
      testData,
      headersTestResults(correlationId),
    );
    expect(response.status()).toBe(201);
    expect(await dbClient.getLatestOrderStatusByOrderUid(orderId)).toEqual("COMPLETE");
  });

  test.afterEach(async () => {
    await dbClient.deleteOrderByUid(orderId);
  });

  test.afterAll(async () => {
    await dbClient.disconnect();
  });
});
```

### Rules

- Use `beforeAll` to open the DB connection and `afterAll` to close it.
- Use `beforeEach` to seed required data and `afterEach` to clean it up.
- Never leave test data in the database after a test run.
- Do not use `console.log` for test output — use the `Logger` utility from `utils/Logger.ts`
  if logging is needed.
