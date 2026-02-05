#!/bin/bash
set -e

for i in {1..10}; do
  SUPPLIER_ID=$(docker exec postgres-db psql "postgresql://app_user:STRONG_APP_PASSWORD@localhost:5432/mydb" -A -t -c "SET search_path TO hometest; SELECT supplier_id FROM supplier WHERE service_url = 'http://wiremock:8080' LIMIT 1;" | grep -v '^$' | grep -v '^SET$')
  if [[ -n "$SUPPLIER_ID" ]]; then
    echo "{\"supplier_id\": \"$SUPPLIER_ID\"}"
    exit 0
  fi
  sleep 2
done

echo "{\"supplier_id\": \"\"}"
exit 1
