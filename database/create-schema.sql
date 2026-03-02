-- =================================================================
-- Create a new schema for a specific environment
--
-- This script provisions a new schema within the same Aurora PostgreSQL
-- database, enabling multiple environments (dev, staging, prod, etc.)
-- to share a single database instance for cost optimization.
--
-- Usage:
--   psql -v schema_name='dev_hometest' -f create-schema.sql
--
-- Or manually set the variable before running:
--   \set schema_name 'dev_hometest'
--   \i create-schema.sql
--
-- The schema_name variable must be set before execution.
-- =================================================================

-- noqa: disable=all
-- (psql :variable syntax is not parseable by sqlfluff)

-- Create the schema
CREATE SCHEMA IF NOT EXISTS :schema_name;

-- Make the migration user own the schema
ALTER SCHEMA :schema_name OWNER TO app_migrator;

-- Grant schema-level privileges to app_migrator
GRANT CREATE, USAGE ON SCHEMA :schema_name TO app_migrator;

-- Grant DML privileges on existing objects
GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
ON ALL TABLES IN SCHEMA :schema_name TO app_migrator;

GRANT USAGE, SELECT, UPDATE
ON ALL SEQUENCES IN SCHEMA :schema_name TO app_migrator;

-- Auto-grant privileges on future tables/sequences for app_migrator
ALTER DEFAULT PRIVILEGES IN SCHEMA :schema_name
GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
ON TABLES TO app_migrator;

ALTER DEFAULT PRIVILEGES IN SCHEMA :schema_name
GRANT USAGE, SELECT, UPDATE
ON SEQUENCES TO app_migrator;

-- Grant schema privileges to app_user
GRANT USAGE ON SCHEMA :schema_name TO app_user;

GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
ON ALL TABLES IN SCHEMA :schema_name TO app_user;

GRANT USAGE, SELECT, UPDATE
ON ALL SEQUENCES IN SCHEMA :schema_name TO app_user;

-- Auto-grant privileges on future tables/sequences for app_user
ALTER DEFAULT PRIVILEGES IN SCHEMA :schema_name
GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
ON TABLES TO app_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA :schema_name
GRANT USAGE, SELECT, UPDATE
ON SEQUENCES TO app_user;

-- Grant admin access
GRANT CREATE, USAGE ON SCHEMA :schema_name TO admin;

-- noqa: enable=all

-- Ensure pgcrypto extension is available (database-level, idempotent)
CREATE EXTENSION IF NOT EXISTS pgcrypto;
