#!/usr/bin/env bash

set -euo pipefail

update_env_value() {
	local file_path=$1
	local key=$2
	local value=$3
	local tmp_file

	tmp_file="${file_path}.tmp"

	awk -v key="$key" -v value="$value" '
		BEGIN {
			updated = 0
		}
		$0 ~ "^" key "=" {
			print key "=" value
			updated = 1
			next
		}
		{
			print
		}
		END {
			if (!updated) {
				print key "=" value
			}
		}
	' "$file_path" > "$tmp_file"

	mv "$tmp_file" "$file_path"
}

sync_supplier_service_url() {
	local supplier_service_url=$1
	local supplier_service_url_sql=${supplier_service_url//\'/\'\'}
	local update_sql="SET search_path TO hometest; UPDATE supplier SET service_url = '${supplier_service_url_sql}';"

	if ! docker ps --format '{{.Names}}' | grep -qx 'postgres-db'; then
		echo "Skipped supplier service URL sync because postgres-db is not running"
		return 0
	fi

	for _ in {1..10}; do
		if docker exec -e UPDATE_SQL="$update_sql" postgres-db sh -lc 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -c "$UPDATE_SQL"' >/dev/null 2>&1; then
			echo "Updated seeded supplier service URLs to ${supplier_service_url}"
			return 0
		fi
		sleep 2
	done

	echo "Failed to update seeded supplier service URLs"
	return 1
}

BACKEND_BASE_URL=$(terraform -chdir=local-environment/infra output -raw backend_base_url)
LOCALHOST_BACKEND_BASE_URL=${BACKEND_BASE_URL/127.0.0.1/localhost}
NHS_LOGIN_AUTHORIZE_URL=$(terraform -chdir=local-environment/infra output -raw nhs_login_authorize_url)
USE_WIREMOCK_AUTH=$(terraform -chdir=local-environment/infra output -raw use_wiremock_auth)
SUPPLIER_SERVICE_URL=$(terraform -chdir=local-environment/infra output -raw supplier_service_url)

case "$USE_WIREMOCK_AUTH" in
	true) TESTS_AUTH_TYPE="wiremock" ;;
	false) TESTS_AUTH_TYPE="sandpit" ;;
	*)
		echo "Unexpected use_wiremock_auth value: $USE_WIREMOCK_AUTH" >&2
		exit 1
		;;
esac

printf 'NEXT_PUBLIC_BACKEND_URL=%s\nNEXT_PUBLIC_NHS_LOGIN_AUTHORIZE_URL=%s\nNEXT_PUBLIC_USE_WIREMOCK_AUTH=%s\n' "$LOCALHOST_BACKEND_BASE_URL" "$NHS_LOGIN_AUTHORIZE_URL" "$USE_WIREMOCK_AUTH" > ./ui/.env.local

TESTS_ENV_FILE=./tests/configuration/.env.local
mkdir -p "$(dirname "$TESTS_ENV_FILE")"
touch "$TESTS_ENV_FILE"

update_env_value "$TESTS_ENV_FILE" "API_BASE_URL" "$LOCALHOST_BACKEND_BASE_URL"
update_env_value "$TESTS_ENV_FILE" "AUTH_TYPE" "$TESTS_AUTH_TYPE"

sync_supplier_service_url "$SUPPLIER_SERVICE_URL"

echo "Updated ui and tests local env files from terraform outputs"
