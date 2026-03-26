#!/bin/bash
set -euo pipefail

# Updates supplier service_url in the database to point at the mock-service
# Lambda running on LocalStack, after Terraform has deployed it.
#
# Called automatically by `npm run local:deploy` after terraform apply.

MOCK_SUPPLIER_URL=$(terraform -chdir=local-environment/infra output -raw mock_supplier_base_url 2>/dev/null || echo "")

if [[ -z "$MOCK_SUPPLIER_URL" ]]; then
  echo "WARNING: Could not read mock_supplier_base_url from terraform outputs."
  echo "         Supplier service_url will not be updated."
  exit 0
fi

echo "Updating supplier service_url → $MOCK_SUPPLIER_URL"

docker exec postgres-db psql \
  "postgresql://app_user:STRONG_APP_PASSWORD@localhost:5432/local_hometest_db" \
  -c "SET search_path TO hometest; UPDATE supplier SET service_url = '${MOCK_SUPPLIER_URL}' WHERE service_url LIKE '%mock-service-placeholder%' OR service_url LIKE '%wiremock%';"

echo "Supplier service_url updated successfully."
