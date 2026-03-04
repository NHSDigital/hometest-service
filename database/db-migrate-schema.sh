#!/bin/bash
set -e

# =================================================================
# Schema-aware database migration script
#
# Provisions a new schema and runs goose migrations against it.
# This enables multiple environments to share a single Aurora
# PostgreSQL database using separate schemas.
#
# Usage:
#   ./db-migrate-schema.sh <schema_name> [db_host] [db_name]
#
# Examples:
#   ./db-migrate-schema.sh dev_hometest
#   ./db-migrate-schema.sh staging_hometest aurora-cluster.xyz.eu-west-2.rds.amazonaws.com mydb
#   ./db-migrate-schema.sh hometest  # default schema (backwards compatible)
#
# Environment variables (override defaults):
#   ADMIN_USER, ADMIN_PASSWORD, MIGRATOR_USER, MIGRATOR_PASSWORD
# =================================================================

SCHEMA_NAME="${1:?Usage: $0 <schema_name> [db_host] [db_name]}"
DB_HOST="${2:-postgres-db}"
LOCAL_DB="${3:-local_hometest_db}"

ADMIN_USER="${ADMIN_USER:-admin}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin}"
MIGRATOR_USER="${MIGRATOR_USER:-app_migrator}"
MIGRATOR_PASSWORD="${MIGRATOR_PASSWORD:-STRONG_PASSWORD_MIGRATOR}"
SQL_DIR="${SQL_DIR:-/docker-entrypoint-initdb.d}"
PSQL_OPTIONS="-v ON_ERROR_STOP=1"
DB_URL="postgresql://${MIGRATOR_USER}:${MIGRATOR_PASSWORD}@${DB_HOST}:5432/${LOCAL_DB}?search_path=${SCHEMA_NAME}"

export PGHOST="$DB_HOST"

echo "Starting database migration for schema: ${SCHEMA_NAME}..."

# Step 1: Create schema and grant permissions (as admin)
export PGPASSWORD="$ADMIN_PASSWORD"
export PGUSER="$ADMIN_USER"

echo "Step 1: Creating schema '${SCHEMA_NAME}' and granting permissions..."
psql $PSQL_OPTIONS -d "$LOCAL_DB" -v schema_name="${SCHEMA_NAME}" -f "$SQL_DIR/create-schema.sql"

# Step 2: Run goose migrations (as migrator, with search_path set to target schema)
export PGPASSWORD="$MIGRATOR_PASSWORD"
export PGUSER="$MIGRATOR_USER"

echo "Step 2: Running goose migrations against schema '${SCHEMA_NAME}'..."
goose -dir "$SQL_DIR/migrations" postgres "$DB_URL" up

# Step 3: Load seed data (as migrator, with search_path)
echo "Step 3: Loading seed data into schema '${SCHEMA_NAME}'..."
psql $PSQL_OPTIONS -d "$LOCAL_DB" -c "SET search_path TO ${SCHEMA_NAME};" -f "$SQL_DIR/03-seed-hometest-data.sql"

echo "Migration complete for schema: ${SCHEMA_NAME}"
