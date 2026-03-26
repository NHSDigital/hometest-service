# Mock Service

Lambda-hosted WireMock-compatible stub runner for dev/test environments, powered by [stubr](https://github.com/beltram/stubr) (Rust). Reads the same WireMock JSON mapping files from `local-environment/wiremock/mappings/` and serves them via a single Lambda function behind API Gateway.

The JSON mapping files are the **single source of truth**. To add or change a mock, edit a JSON stub file — no code changes needed.

## How it works

1. At build time, `cargo lambda build` compiles a native `bootstrap` binary, then all WireMock JSON mapping files are copied from `../local-environment/wiremock/mappings/` into the Lambda bundle alongside it.
2. On cold start, stubr loads every `.json` file from the bundled `mappings/` directory and starts an in-process HTTP stub server.
3. For each incoming request, the Lambda strips API Gateway prefixes (`/mock/supplier/`, `/mock/cognito/`, `/mock/`) and proxies the request to stubr, which evaluates WireMock matching rules and returns the matching response.
4. stubr handles response templating (`{{randomValue}}`, `{{now}}`, etc.) natively.

## Prerequisites

- **Rust toolchain**: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- **cargo-lambda**: `cargo install cargo-lambda` (or `pip install cargo-lambda`)
- **Zig** (for cross-compilation): `cargo lambda` uses Zig under the hood — install via `pip install ziglang` or your package manager

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

Rebuild the mock-service to pick up the change. No Rust code changes needed.

## URL path prefixes

API Gateway routes requests under `/mock/supplier/` and `/mock/cognito/` prefixes. The Lambda strips these before matching against stub files:

- `/mock/supplier/oauth/token` → matches stubs with `"urlPath": "/oauth/token"`
- `/mock/cognito/.well-known/jwks.json` → matches stubs with `"urlPath": "/.well-known/jwks.json"`

## Local development

```bash
cd mock-service
npm run build      # cargo lambda build + copy mappings → dist/
npm run package    # zip → dist/mock-service-lambda.zip (bootstrap + mappings/)
```

### Running locally (via LocalStack)

The mock-service is deployed to LocalStack alongside the other Lambdas as part of `npm run local:deploy` from the repo root. It replaces the WireMock Docker container.

The local flow:

1. `npm run build:mock-service && npm run package:mock-service` — builds the zip (compiles Rust binary + bundles JSON mappings)
2. `npm run local:terraform:apply` — deploys it as a Lambda (`provided.al2023`) + API Gateway on LocalStack
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
├── Cargo.toml                # Rust dependencies (stubr, lambda_http, reqwest)
├── package.json              # npm scripts wrapping cargo/shell commands
├── scripts/
│   ├── build.sh              # cargo lambda build + copy mappings
│   └── package.sh            # zip bootstrap + mappings/
└── src/
    └── main.rs               # Lambda handler — starts stubr, proxies requests
```
