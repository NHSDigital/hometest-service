#!/usr/bin/env bash

set -euo pipefail

LOGIN_ENDPOINT=$(terraform -chdir=local-environment/infra output -raw login_endpoint)
ORDER_RESULT_ENDPOINT=$(terraform -chdir=local-environment/infra output -raw order_result_endpoint)
API_BASE_URL="${ORDER_RESULT_ENDPOINT%/result}"

printf 'NEXT_PUBLIC_LOGIN_LAMBDA_ENDPOINT=%s\n' "$LOGIN_ENDPOINT" > ./ui/.env.local

TESTS_ENV_FILE=./tests/configuration/.env.local
mkdir -p "$(dirname "$TESTS_ENV_FILE")"
touch "$TESTS_ENV_FILE"

if grep -q '^API_BASE_URL=' "$TESTS_ENV_FILE"; then
	sed -E "s|^API_BASE_URL=.*$|API_BASE_URL=$API_BASE_URL|" "$TESTS_ENV_FILE" > "${TESTS_ENV_FILE}.tmp"
	mv "${TESTS_ENV_FILE}.tmp" "$TESTS_ENV_FILE"
else
	printf '\nAPI_BASE_URL=%s\n' "$API_BASE_URL" >> "$TESTS_ENV_FILE"
fi

echo "Updated ui and tests local env files from terraform outputs"
