#!/usr/bin/env bash
# Invalidates the in-memory JWKS cache of the login Lambda by forcing a cold start.
#
# The login Lambda's JwksClient caches public keys in memory. When WireMock is
# reset and new RSA key pairs are generated, the warm Lambda container still
# holds the old keys causing JWT verification failures (~5 min until cold start).
#
# Usage:
#   bash scripts/tests/reset-login-lambda-cache.sh
#   bash scripts/tests/reset-login-lambda-cache.sh my-custom-function-name
#
# Environment variables:
#   ENV               - Target environment (local, dev, uat). Default: local
#   AWS_LAMBDA_NAME   - Override Lambda function name for remote environments.
set -euo pipefail

FUNCTION_NAME="${1:-hometest-service-login}"
ENV="${ENV:-local}"
LOCALSTACK_CONTAINER="${LOCALSTACK_CONTAINER:-localstack-main}"

if [[ "${ENV}" == "local" ]]; then
  # Local mode: use LocalStack inside Docker
  if ! docker ps --format "{{.Names}}" | grep -q "^${LOCALSTACK_CONTAINER}$"; then
    echo "⚠️  LocalStack container '${LOCALSTACK_CONTAINER}' is not running — skipping Lambda cache reset"
    exit 0
  fi

  echo "♻️  Resetting JWKS cache for Lambda (LocalStack): ${FUNCTION_NAME}"

  docker exec "${LOCALSTACK_CONTAINER}" awslocal lambda update-function-configuration \
    --function-name "${FUNCTION_NAME}" \
    --description "cache-bust-$(date +%s)" \
    --output text > /dev/null
else
  # Remote mode: use real AWS CLI
  REMOTE_FUNCTION_NAME="${AWS_LAMBDA_NAME:-hometest-${ENV}-login}"

  if ! command -v aws &>/dev/null; then
    echo "⚠️  AWS CLI not found — skipping Lambda cache reset for ${ENV}"
    exit 0
  fi

  echo "♻️  Resetting JWKS cache for Lambda (AWS ${ENV}): ${REMOTE_FUNCTION_NAME}"

  aws lambda update-function-configuration \
    --function-name "${REMOTE_FUNCTION_NAME}" \
    --description "cache-bust-$(date +%s)" \
    --output text > /dev/null 2>&1 || {
    echo "⚠️  Could not reset Lambda cache for ${REMOTE_FUNCTION_NAME} — continuing anyway"
    exit 0
  }
fi

echo "✅ Lambda cache invalidated: ${FUNCTION_NAME}"
