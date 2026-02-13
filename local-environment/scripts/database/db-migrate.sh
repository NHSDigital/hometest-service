#!/bin/bash
set -e

# Configuration variables
DB_HOST="postgres-db"
ADMIN_USER="admin"
ADMIN_PASSWORD="admin"
MIGRATOR_USER="app_migrator"
MIGRATOR_PASSWORD="STRONG_PASSWORD_MIGRATOR"
LOCAL_DB="local_hometest_db"
SQL_DIR="/docker-entrypoint-initdb.d"
PSQL_OPTIONS="-v ON_ERROR_STOP=1"
DB_URL="postgresql://${MIGRATOR_USER}:${MIGRATOR_PASSWORD}@${DB_HOST}:5432/${LOCAL_DB}"

export PGHOST="$DB_HOST"

echo "Starting database migration..."

# Admin user operations
export PGPASSWORD="$ADMIN_PASSWORD"
export PGUSER="$ADMIN_USER"

# echo "Step 0: Dropping existing database..."
# psql $PSQL_OPTIONS -d "postgres" -f "$SQL_DIR/00-delete.sql"

echo "Step 1: Initializing database..."
psql $PSQL_OPTIONS -d "$LOCAL_DB" -f "$SQL_DIR/01-init.sql"

# Migrator user operations
export PGPASSWORD="$MIGRATOR_PASSWORD"
export PGUSER="$MIGRATOR_USER"

echo "Step 2: Running goose migrations..."
goose -dir "$SQL_DIR/migrations" postgres "$DB_URL" up

echo "Step 3: Loading static data..."
psql $PSQL_OPTIONS -d "$LOCAL_DB" -f "$SQL_DIR/03-static-data.sql"
