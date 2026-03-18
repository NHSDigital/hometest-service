#!/usr/bin/env bash

set -euo pipefail

BACKEND_BASE_URL=$(terraform -chdir=local-environment/infra output -raw backend_base_url)
NHS_LOGIN_AUTHORIZE_URL=$(terraform -chdir=local-environment/infra output -raw nhs_login_authorize_url)

printf 'NEXT_PUBLIC_BACKEND_URL=%s\nNEXT_PUBLIC_NHS_LOGIN_AUTHORIZE_URL=%s\n' "$BACKEND_BASE_URL" "$NHS_LOGIN_AUTHORIZE_URL" > ./ui/.env.local

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
