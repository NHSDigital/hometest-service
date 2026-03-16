# Mock Service

Lambda-hosted WireMock-compatible stub runner for dev/test environments. Reads the same WireMock JSON mapping files from `local-environment/wiremock/mappings/` and serves them via a single Lambda function behind API Gateway.

The JSON mapping files are the **single source of truth** — no per-endpoint TypeScript handlers. To add or change a mock, edit a JSON stub file.

## How it works

1. At build time, all WireMock JSON mapping files are copied from `../local-environment/wiremock/mappings/` into the Lambda bundle.
2. On cold start, the Lambda loads every `.json` file from the bundled `mappings/` directory.
3. For each incoming request, the stub matcher evaluates WireMock matching rules (method, URL path/pattern, headers, query parameters, body patterns) and returns the first matching response (respecting priority).
4. Response templates (`{{randomValue type='UUID'}}`, `{{now}}`) are rendered before returning.

## Supported WireMock features

| Feature | Example |
|---|---|
| Exact URL path | `"urlPath": "/oauth/token"` |
| Regex URL path | `"urlPathPattern": "/order/.*"` |
| Method matching | `"method": "POST"` |
| Header matching | `"contains"`, `"matches"` (regex), `"equalTo"` |
| Query parameter matching | `"matches"` (regex), `"equalTo"`, `"absent": true` |
| Body patterns | `"matches"` (regex), `"matchesJsonPath"` with `"absent": true` |
| Priority | `"priority": 1` (lower = matched first) |
| JSON response body | `"jsonBody": { ... }` |
| String response body | `"body": "..."` |
| Response headers | `"headers": { "Content-Type": "..." }` |
| Response templating | `{{randomValue type='UUID'}}`, `{{now}}`, `{{now offset='-2 days' format='yyyy-MM-dd'}}` |

## Adding or changing mocks

Drop a new JSON file into `local-environment/wiremock/mappings/`:

```json
{
  "request": {
    "method": "GET",
    "urlPath": "/my-new-endpoint"
  },
  "response": {
    "status": 200,
    "headers": { "Content-Type": "application/json" },
    "jsonBody": { "message": "hello" }
  }
}
```

Rebuild the mock-service to pick up the change. No TypeScript code changes needed.

## URL path prefixes

API Gateway routes requests under `/mock/supplier/` and `/mock/cognito/` prefixes. The Lambda strips these before matching against stub files:

- `/mock/supplier/oauth/token` → matches stubs with `"urlPath": "/oauth/token"`
- `/mock/cognito/.well-known/jwks.json` → matches stubs with `"urlPath": "/.well-known/jwks.json"`

## Local development

```bash
cd mock-service
npm install
npm test           # run unit tests
npm run build      # esbuild → dist/mock-service-lambda/index.js + mappings/
npm run package    # zip → dist/mock-service-lambda.zip (includes mappings)
```

### Running locally (via LocalStack)

The mock-service is deployed to LocalStack alongside the other Lambdas as part of `npm run local:deploy` from the repo root. It replaces the WireMock Docker container.

The local flow:

1. `npm run build:mock-service && npm run package:mock-service` — builds the zip (bundles JSON mappings)
2. `npm run local:terraform:apply` — deploys it as a Lambda + API Gateway on LocalStack
3. `npm run local:update-supplier-url` — updates the DB supplier `service_url` to point at the mock API Gateway

All three steps run automatically as part of `npm run local:deploy`.

## Deploying to AWS

The mock service is deployed as a nested Terragrunt module under `hometest-app` (same pattern as `lambda-goose-migrator`):

```bash
cd hometest-mgmt-terraform/infrastructure/environments/poc/hometest-app/dev/mock-service
terragrunt apply
```

After deployment, the outputs provide URLs to plug into `hometest-app`:

```bash
supplier_api_base_url  = https://xxx.execute-api.eu-west-2.amazonaws.com/v1/mock/supplier
cognito_jwks_url       = https://xxx.execute-api.eu-west-2.amazonaws.com/v1/mock/cognito/.well-known/jwks.json
postcode_api_base_url  = https://xxx.execute-api.eu-west-2.amazonaws.com/v1/mock/postcode
```

Set these as environment variables in the `hometest-app` dev environment's `terragrunt.hcl`:

```hcl
inputs = {
  lambdas = {
    "order-service-lambda" = {
      environment = {
        SUPPLIER_API_BASE_URL = dependency.mock_service.outputs.supplier_api_base_url
      }
    }
    "custom-authorizer" = {
      environment = {
        COGNITO_JWKS_URL = dependency.mock_service.outputs.cognito_jwks_url
      }
    }
  }
}
```

## Project structure

```bash
mock-service/
├── package.json
├── tsconfig.json
├── jest.config.ts
├── scripts/
│   ├── build.ts              # esbuild bundler + copies JSON mappings
│   └── package.ts            # zip creator (includes mappings/)
└── src/
    ├── index.ts              # Lambda entry point — loads stubs, routes requests
    ├── stub-matcher.ts       # Generic WireMock-compatible request matcher
    ├── stub-matcher.test.ts
    ├── template-engine.ts    # WireMock response template renderer
    └── template-engine.test.ts
```
