# WireMock Mapping Factories

Reusable factory functions for creating WireMock stub mappings in tests.

## Overview

This package provides type-safe factory functions for creating dynamic WireMock mappings in Playwright tests. Instead of writing large JSON mapping objects inline, use these factories to create mappings with sensible defaults and flexible options.

## Available Factories

### Supplier Results Mappings

Located in `SupplierResultsWireMockMappings.ts`:

```typescript
import { createSupplierResultNotFoundMapping } from "../../utils/wireMockMappings";

// Create a 404 results not found response
const mapping = createSupplierResultNotFoundMapping(orderId, { priority: 1 });
await wiremock.createMapping(mapping);
```

Functions:

- `createSupplierResultSuccessMapping(orderId, patientId, supplierId, options?)` - Normal result (200)
- `createSupplierResultNotFoundMapping(orderId, options?)` - Result not found (404)
- `createSupplierResultServerErrorMapping(orderId, options?)` - Server error (500)
- `createSupplierResultAbnormalMapping(orderId, patientId, supplierId, options?)` - Abnormal result (200)

### Supplier Order Mappings

Located in `SupplierOrderWireMockMappings.ts`:

```typescript
import { createSupplierOrderNotFoundMapping } from "../../utils/wireMockMappings";

// Create a 404 order not found response
const mapping = createSupplierOrderNotFoundMapping(nhsNumber, dob, orderId);
await wiremock.createMapping(mapping);
```

Functions:

- `createSupplierOrderSuccessMapping(options?)` - Order created successfully (201)
- `createSupplierOrderNotFoundMapping(nhsNumber?, dob?, orderId?, options?)` - Order not found (404)
- `createSupplierOrderUnprocessableMapping(options?)` - Validation error (422)

### Supplier OAuth Mappings

Located in `SupplierOAuthWireMockMappings.ts`:

```typescript
import { createSupplierOAuthInvalidCredentialsMapping } from "../../utils/wireMockMappings";

// Create an invalid credentials OAuth response
const mapping = createSupplierOAuthInvalidCredentialsMapping();
await wiremock.createMapping(mapping);
```

Functions:

- `createSupplierOAuthTokenMapping(options?)` - Successful token response (200)
- `createSupplierOAuthInvalidCredentialsMapping(options?)` - Invalid client (401)
- `createSupplierOAuthInvalidGrantTypeMapping(options?)` - Unsupported grant type (400)
- `createSupplierOAuthMissingParamsMapping(options?)` - Missing parameters (400)

### OS Places Postcode Lookup Mappings

Located in `OSPlacesWireMockMappings.ts`:

```typescript
import {
  createOSPlacesSuccessMapping,
  createDefaultTestAddresses
} from "../../utils/wireMockMappings";

// Create a successful postcode lookup
const mapping = createOSPlacesSuccessMapping({
  postcode: "TN37 7PT",
  addresses: createDefaultTestAddresses("TN37 7PT"),
  priority: 1,
});
await wiremock.createMapping(mapping);
```

Functions:

- `createOSPlacesSuccessMapping({ postcode, addresses, priority? })` - Found addresses (200)
- `createOSPlacesNotFoundMapping(postcode, options?)` - No results (404)
- `createDefaultTestAddresses(postcode)` - Generate 2 test addresses for a postcode

## Common Options

All factories accept an optional `options` parameter with:

- `priority?: number` - WireMock priority (lower = higher precedence, default varies by factory)
- `correlationId?: string` - Match specific correlation ID or allow any (default: allow any)

## Usage Pattern

```typescript
test("my test", async ({ wiremock, hivResultsApi }) => {
  // Arrange: create mapping
  const mapping = createSupplierResultNotFoundMapping(orderId);
  await wiremock.createMapping(mapping);

  // Act: call API
  const response = await hivResultsApi.getResult(params, headers);

  // Assert: verify response
  expect(response.status()).toBe(404);

  // Cleanup happens automatically via fixture teardown
});
```

## Automatic Cleanup

Mappings created via `wiremock.createMapping()` are automatically deleted after each test via the `wiremockFixture` teardown hook. No manual cleanup needed.

## Parallel Execution

Each test gets its own `WireMockClient` instance and tracks only its own created mappings. When mappings are scoped to specific identifiers (like `orderId`), parallel tests won't interfere with each other.

## When to Use

- **Use factories** when you need standard response patterns (404, 500, success)
- **Use inline mappings** when you need custom matching logic or complex transformations
- **Prefer factories** for maintainability - changes to response formats propagate to all tests

## Example: Refactoring to Use Factories

Before:

```typescript
const mapping: WireMockMapping = {
  priority: 1,
  request: {
    method: "GET",
    urlPathPattern: "/(results|api/results|nhs_home_test/results)",
    queryParameters: { order_uid: { equalTo: orderId } },
    headers: { "X-Correlation-ID": { matches: ".*" } },
  },
  response: {
    status: 404,
    headers: { "Content-Type": "application/fhir+json" },
    jsonBody: { /* 30 lines of FHIR OperationOutcome */ },
  },
};
```

After:

```typescript
const mapping = createSupplierResultNotFoundMapping(orderId, { priority: 1 });
```
