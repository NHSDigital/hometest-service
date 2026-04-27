# Postman Collections

This directory contains manual API collections for local and upstream testing.

## Preview Session Login With WireMock

Use these files together:

- `session_login_preview_wiremock.postman_collection.json`
- `session_login_preview_wiremock.local.postman_environment.json`

This collection exercises the preview-only `session-login-lambda` on the local LocalStack API while NHS Login upstreams are mocked by WireMock on `http://localhost:8080`.

### Manual Postman Usage

1. Start the local environment so LocalStack, WireMock, and the lambdas are running.
2. Import the collection and the local environment file.
3. Refresh the `api_gateway_id` in the imported environment if you have recreated the local Terraform stack.
4. Run `Capture Mock Authorisation Code` if you want Postman to fetch a fresh mock code from WireMock.
5. Run `200: success with mock auth code` to hit the preview route.

### Keeping `api_gateway_id` Up To Date

The environment is set up so only `api_gateway_id` needs manual refresh.
`execute_api_base_localstack` and `session_login_endpoint_localstack` are derived from it.

To get the current value from the active local stack, run:

```bash
terraform -chdir=local-environment/infra output -raw api_gateway_id
```

If you are at the repository root and prefer the repo script toolchain, this is equivalent:

```bash
pnpm exec terraform -chdir=local-environment/infra output -raw api_gateway_id
```

Update the imported Postman environment variable `api_gateway_id` with that output whenever you run `pnpm run local:terraform:apply`, `pnpm run local:start`, or any other workflow that recreates the API Gateway.

If you do not recreate LocalStack Terraform resources, the value usually stays stable and does not need changing between manual runs.

### CLI Alternative

For a non-manual run, use:

```bash
pnpm run test:postman:session-login-preview
```

That script resolves the current `api_gateway_id` from Terraform at runtime and passes the correct endpoint values to Newman, so you do not need to edit the environment file first.
