# Mock Service

Lambda-hosted mock API for dev/test environments. Replaces WireMock Docker with a serverless deployment that can be shared across dev environments on AWS.

## What it mocks

| Route | Purpose | Replaces |
|---|---|---|
| `GET /mock/health` | Health check | — |
| `POST /mock/supplier/oauth/token` | OAuth2 client_credentials grant | WireMock `oauth-token.json` |
| `POST /mock/supplier/order` | Create FHIR ServiceRequest order | WireMock `order-success.json` |
| `GET /mock/supplier/order` | Get order status | WireMock `order-confirmed.json` etc. |
| `GET /mock/supplier/results` | Get test results (FHIR Observation) | WireMock `results-success.json` |
| `GET /mock/cognito/.well-known/jwks.json` | JWKS public key set | Not previously mocked |
| `GET /mock/postcode/{postcode}` | Postcode → local authority | Not previously mocked |

## Controlling responses

Send the `X-Mock-Status` header to force specific error scenarios:

```bash
# OAuth: force 401 (invalid credentials)
curl -X POST .../mock/supplier/oauth/token -H "X-Mock-Status: 401" ...

# Order: force 404 (not found) or 422 (unprocessable)
curl .../mock/supplier/order?order_id=xxx -H "X-Mock-Status: 404"

# Order: force status variant (dispatched, confirmed, complete)
curl .../mock/supplier/order?order_id=xxx -H "X-Mock-Status: dispatched"

# Results: force 404 (not found) or 400 (invalid)
curl .../mock/supplier/results?order_uid=xxx -H "X-Mock-Status: 404"
```

## JWKS / JWT signing

The `/mock/cognito/.well-known/jwks.json` endpoint returns an RSA public key.

- **Auto-generated**: On cold start, a fresh RSA key pair is generated. The public key is served at the JWKS endpoint, and the private key stays in memory.
- **Shared key**: Set `MOCK_JWKS_PRIVATE_KEY` (PEM-encoded RSA private key) as a Lambda env var so all dev services use the same signing key.

The `signMockJwt()` function (exported from `src/handlers/jwks.ts`) signs payloads with the private key for use in tests.

## Local development

```bash
cd mock-service
npm install
npm test           # run unit tests
npm run build      # esbuild → dist/mock-service-lambda/index.js
npm run package    # zip → dist/mock-service-lambda.zip
```

### Running locally (via LocalStack)

The mock-service is deployed to LocalStack alongside the other Lambdas as part of `npm run local:deploy` from the repo root. It replaces the WireMock Docker container.

The local flow:

1. `npm run build:mock-service && npm run package:mock-service` — builds the zip
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
│   ├── build.ts          # esbuild bundler
│   └── package.ts        # zip creator
└── src/
    ├── index.ts           # Lambda entry point (Middy)
    ├── router.ts          # Path-based request router
    ├── router.test.ts
    ├── utils/
    │   └── response.ts    # JSON / FHIR response helpers
    ├── handlers/
    │   ├── health.ts
    │   ├── jwks.ts         # JWKS + JWT signing utility
    │   ├── jwks.test.ts
    │   ├── oauth-token.ts  # OAuth2 client_credentials
    │   ├── oauth-token.test.ts
    │   ├── order.ts        # FHIR ServiceRequest mock
    │   ├── postcode.ts     # Postcode lookup mock
    │   └── results.ts      # FHIR Observation results
    └── test-utils/
        └── mock-event.ts   # APIGatewayProxyEvent factory
```
