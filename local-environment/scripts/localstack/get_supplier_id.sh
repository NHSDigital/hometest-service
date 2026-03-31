#!/bin/bash
set -euo pipefail

if ! docker ps --format '{{.Names}}' | grep -qx 'postgres-db'; then
  echo '{"supplier_id": ""}'
  exit 0
fi

for _ in {1..10}; do
  SUPPLIER_ID=$(
    docker exec postgres-db sh -lc '
      psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -A -t -v ON_ERROR_STOP=1 \
        -c "SET search_path TO hometest; SELECT supplier_id FROM supplier ORDER BY supplier_id LIMIT 1;"
    ' \
      2>/dev/null | grep -v '^$' | grep -v '^SET$' | head -n 1 || echo ""
  )

  if [[ -n "$SUPPLIER_ID" ]]; then
    echo "{\"supplier_id\": \"$SUPPLIER_ID\"}"
    exit 0
  fi

  sleep 2
done

echo '{"supplier_id": ""}'
exit 0
