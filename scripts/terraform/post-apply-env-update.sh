#!/usr/bin/env bash

set -euo pipefail

BACKEND_BASE_URL=$(terraform -chdir=local-environment/infra output -raw backend_base_url)
POSTCODE_LOOKUP_ENDPOINT=$(terraform -chdir=local-environment/infra output -raw postcode_lookup_endpoint)

printf 'NEXT_PUBLIC_BACKEND_URL=%s\n' "$BACKEND_BASE_URL" > ./ui/.env.local
printf 'NEXT_PUBLIC_POSTCODE_LOOKUP_LAMBDA_ENDPOINT=%s\n' "$POSTCODE_LOOKUP_ENDPOINT" >> ./ui/.env.local

TESTS_ENV_FILE=./tests/configuration/.env.local
mkdir -p "$(dirname "$TESTS_ENV_FILE")"
touch "$TESTS_ENV_FILE"

if grep -q '^API_BASE_URL=' "$TESTS_ENV_FILE"; then
	sed -E "s|^API_BASE_URL=.*$|API_BASE_URL=$BACKEND_BASE_URL|" "$TESTS_ENV_FILE" > "${TESTS_ENV_FILE}.tmp"
	mv "${TESTS_ENV_FILE}.tmp" "$TESTS_ENV_FILE"
else
	printf '\nAPI_BASE_URL=%s\n' "$BACKEND_BASE_URL" >> "$TESTS_ENV_FILE"
fi

echo "Updated ui and tests local env files from terraform outputs"
