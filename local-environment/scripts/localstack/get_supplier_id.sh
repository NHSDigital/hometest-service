#!/bin/bash
set -e

for _ in {1..10}; do
  SUPPLIER_ID=$(docker exec postgres-db psql "postgresql://app_user:STRONG_APP_PASSWORD@localhost:5432/local_hometest_db" -A -t -c "SET search_path TO hometest; SELECT supplier_id FROM supplier LIMIT 1;" 2>/dev/null | grep -v '^$' | grep -v '^SET$' | head -n 1 || echo "")
  if [[ -n "$SUPPLIER_ID" ]]; then
    echo "{\"supplier_id\": \"$SUPPLIER_ID\"}"
    exit 0
  fi
  sleep 2
done

echo "{\"supplier_id\": \"\"}"
exit 1
