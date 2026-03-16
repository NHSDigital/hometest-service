# Mock Service — Test Scenario Routing

## How to achieve different data per test scenario

There are several patterns for this, ranging from simple (no code changes) to more dynamic:

### 1. Request-based routing (works with stubr today)

WireMock matches on **request attributes**, so different inputs naturally get different responses. You already do this:

```json
// order-success.json — matches when request body has valid fields
{ "request": { "method": "POST", "urlPath": "/order", "bodyPatterns": [{ "matchesJsonPath": "$.email" }] },
  "response": { "status": 200 } }

// order-missing-email.json — matches when email is absent
{ "request": { "method": "POST", "urlPath": "/order", "bodyPatterns": [{ "matchesJsonPath": { "expression": "$.email", "absent": true } }] },
  "response": { "status": 422 } }
```

**Test scenario control**: your test code sends different request data → gets different responses. No mock configuration needed per test.

### 2. Custom header routing (works with stubr today)

Add stubs that match on a special header. Tests set the header to select a scenario:

```json
// order-scenario-dispatched.json
{
  "priority": 1,
  "request": {
    "method": "GET",
    "urlPathPattern": "/order/.*",
    "headers": { "X-Mock-Scenario": { "equalTo": "dispatched" } }
  },
  "response": { "status": 200, "jsonBody": { "status": "dispatched" } }
}

// order-default.json (lower priority fallback)
{
  "priority": 5,
  "request": {
    "method": "GET",
    "urlPathPattern": "/order/.*"
  },
  "response": { "status": 200, "jsonBody": { "status": "received" } }
}
```

Test code:

```typescript
// Test: order is dispatched
const res = await fetch(`${supplierUrl}/order/123`, {
  headers: { "X-Mock-Scenario": "dispatched" }
});
```

**Caveat**: the header must flow through your real service to the supplier call. This works if your order-service Lambda forwards custom headers (or you can add that).

### 3. URL-based scenario routing (works with stubr today)

Use different URL paths or query parameters per scenario:

```json
// Match specific order IDs
{ "request": { "method": "GET", "urlPath": "/order/NOT_FOUND" },
  "response": { "status": 404 } }

{ "request": { "method": "GET", "urlPathPattern": "/order/DISPATCH.*" },
  "response": { "status": 200, "jsonBody": { "status": "dispatched" } } }

// Default fallback
{ "request": { "method": "GET", "urlPathPattern": "/order/.*" },
  "response": { "status": 200, "jsonBody": { "status": "received" } } }
```

Test code just creates orders with well-known IDs.

### 4. WireMock Scenarios (stateful — NOT supported by stubr)

Real WireMock has a `"scenario"` + `"requiredScenarioState"` + `"newScenarioState"` feature that returns different responses on sequential calls. **stubr does not support this**. You'd need:

- **WireMock proper** (Java/Docker) as a long-running service, OR
- The custom TypeScript matcher with added state management

### Recommendation

**Approach #2 or #3** covers most test scenarios without any code changes — just add JSON stubs with different priority/matching rules. The pattern is:

| Test needs... | Stub matches on... |
|---|---|
| Error response | Request body missing required fields |
| Specific status | `X-Mock-Scenario` header or well-known ID in URL |
| Default happy path | Low-priority catch-all stub |

If you find yourself needing **stateful scenarios** (e.g., "first call returns pending, second call returns complete"), that's where stubr falls short and you'd need WireMock running as a persistent service.

---

## Running multiple test scenarios against the same AWS environment

With static stubs (stubr or any file-based approach), the mock has no state — it can only differentiate based on what's in the request.

### What works: convention-based test data

Design your stubs around **well-known patterns** in the request data that your test controls:

```json
// order-not-found.json — any order ID starting with "NOTFOUND-"
{ "request": { "method": "GET", "urlPathPattern": "/order/NOTFOUND-.*" },
  "response": { "status": 404 } }

// order-dispatched.json — any order ID starting with "DISPATCHED-"
{ "request": { "method": "GET", "urlPathPattern": "/order/DISPATCHED-.*" },
  "response": { "status": 200, "jsonBody": { "status": "dispatched" } } }

// order-default.json — everything else gets "received"
{ "priority": 10,
  "request": { "method": "GET", "urlPathPattern": "/order/.*" },
  "response": { "status": 200, "jsonBody": { "status": "received" } } }
```

Each test creates its order with a deterministic ID:

```typescript
// Test A — expects "not found"
const orderId = `NOTFOUND-${uuid()}`;

// Test B — expects "dispatched"
const orderId = `DISPATCHED-${uuid()}`;

// Test C — expects default "received"
const orderId = `SCENARIO-C-${uuid()}`;
```

This works **concurrently** — multiple tests hitting the same mock Lambda at the same time, each getting the right response because the request URL differs.

### What doesn't work with static stubs

If your tests need the **exact same request** to return **different data at different times** — e.g.:

1. Test calls `GET /order/123` → expects "received"
2. Same test calls `GET /order/123` again → expects "dispatched"

That's **stateful mocking** (WireMock's "scenarios" feature). No static stub server — stubr, the custom TS matcher, or any file-based approach — can do this on Lambda, because:

- Lambda is stateless between invocations
- stubr doesn't implement WireMock scenarios even if it were long-running

### If you need stateful mocking

You'd need **WireMock proper running as a persistent service** (not a Lambda):

| Option | How |
|---|---|
| **WireMock on Fargate/ECS** | Docker container running `wiremock/wiremock`, always-on |
| **WireMock in test harness** | Start WireMock in-process during test run (Java/Node testcontainers) |
| **WireMock Cloud** | SaaS, hosted by WireMock team |

With a persistent WireMock, tests could use the admin API to set scenario state before each test.

### Bottom line

**For 90% of integration test scenarios**: convention-based stub routing (URL patterns, body content, headers) works fine with stubr on Lambda and supports concurrent test execution.

**For sequential state changes** (same request → different response on Nth call): you need a long-running WireMock instance, not a Lambda.
