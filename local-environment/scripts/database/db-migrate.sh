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

export PGHOST="$DB_HOST"

echo "Starting database migration..."

# Admin user operations
export PGPASSWORD="$ADMIN_PASSWORD"
export PGUSER="$ADMIN_USER"

echo "Step 1: Dropping existing database..."
psql $PSQL_OPTIONS -d "postgres" -f "$SQL_DIR/00-delete.sql"

echo "Step 2: Initializing database..."
psql $PSQL_OPTIONS -d "$LOCAL_DB" -f "$SQL_DIR/01-init.sql"

# Migrator user operations
export PGPASSWORD="$MIGRATOR_PASSWORD"
export PGUSER="$MIGRATOR_USER"

echo "Step 3: Creating tables..."
psql $PSQL_OPTIONS -d "$LOCAL_DB" -f "$SQL_DIR/02-tables.sql"

echo "Step 4: Loading static data..."
psql $PSQL_OPTIONS -d "$LOCAL_DB" -f "$SQL_DIR/03-static-data.sql"

echo "Step 5: Loading seed data..."
psql $PSQL_OPTIONS -d "$LOCAL_DB" -f "$SQL_DIR/04-seed.sql"
