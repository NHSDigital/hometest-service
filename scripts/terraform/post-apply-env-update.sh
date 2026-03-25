#!/usr/bin/env bash

set -euo pipefail

BACKEND_BASE_URL=$(terraform -chdir=local-environment/infra output -raw backend_base_url)

if [[ "$BACKEND_BASE_URL" != http://* ]]; then
	echo "Could not read backend_base_url from terraform outputs" >&2
	exit 1
fi

UI_BACKEND_BASE_URL="${BACKEND_BASE_URL/127.0.0.1/localhost}"

printf 'NEXT_PUBLIC_BACKEND_URL=%s\n' "$UI_BACKEND_BASE_URL" > ./ui/.env.local

TESTS_ENV_FILE=./tests/configuration/.env.local
mkdir -p "$(dirname "$TESTS_ENV_FILE")"
touch "$TESTS_ENV_FILE"

upsert_env_var() {
	local key="$1"
	local value="$2"
	local temp_file="${TESTS_ENV_FILE}.tmp"

	grep -v "^${key}=" "$TESTS_ENV_FILE" > "$temp_file" || true
	printf '%s=%s\n' "$key" "$value" >> "$temp_file"
	mv "$temp_file" "$TESTS_ENV_FILE"
}

upsert_env_var "API_BASE_URL" "$BACKEND_BASE_URL"

echo "Updated ui and tests local env files from terraform outputs"
