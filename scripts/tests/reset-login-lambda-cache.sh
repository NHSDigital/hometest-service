#!/usr/bin/env bash
# Invalidates the in-memory JWKS cache of the login Lambda by forcing a cold start.
#
# The login Lambda's JwksClient caches public keys in memory. When WireMock is
# reset and new RSA key pairs are generated, the warm Lambda container still
# holds the old keys causing JWT verification failures (~5 min until cold start).
#
# Forcing a cold start: set reserved concurrency to 0 (kills warm containers),
# then delete reserved concurrency (restores unrestricted execution).
#
# Usage:
#   bash scripts/tests/reset-login-lambda-cache.sh
#   bash scripts/tests/reset-login-lambda-cache.sh my-custom-function-name
set -euo pipefail

FUNCTION_NAME="${1:-hometest-service-login}"
LOCALSTACK_CONTAINER="${LOCALSTACK_CONTAINER:-localstack-main}"

if ! docker ps --format "{{.Names}}" | grep -q "^${LOCALSTACK_CONTAINER}$"; then
  echo "⚠️  LocalStack container '${LOCALSTACK_CONTAINER}' is not running — skipping Lambda cache reset"
  exit 0
fi

echo "♻️  Resetting JWKS cache for Lambda: ${FUNCTION_NAME}"

# Force a Lambda cold start by updating the function description (no-op change).
# This signals LocalStack to retire the current warm execution environment so the
# next invocation cold-starts with an empty JwksClient cache, fetching fresh JWKS.
#
# We update only the description — never the environment variables — so we cannot
# accidentally wipe the function's configuration.
docker exec "${LOCALSTACK_CONTAINER}" awslocal lambda update-function-configuration \
  --function-name "${FUNCTION_NAME}" \
  --description "cache-bust-$(date +%s)" \
  --output text > /dev/null

echo "✅ Lambda cache invalidated: ${FUNCTION_NAME}"
