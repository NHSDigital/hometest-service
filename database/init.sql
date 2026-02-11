-- Create a dedicated schema
CREATE SCHEMA IF NOT EXISTS hometest;

-- =====================
-- Create a migration user
-- =====================
DO
$$
  BEGIN
    IF
      NOT EXISTS (
        SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_migrator'
      ) THEN
      CREATE ROLE app_migrator LOGIN PASSWORD 'STRONG_PASSWORD_MIGRATOR';
    END IF;
  END$$;

-- Make the migration user own the schema
ALTER
  SCHEMA hometest OWNER TO app_migrator;

-- Set the default search path for migrations
ALTER
  ROLE app_migrator SET search_path TO hometest;

-- Grant schema-level privileges
GRANT CREATE, USAGE
  ON SCHEMA hometest TO app_migrator;

-- Grant privileges on existing objects (if you already have tables/sequences)
GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON ALL TABLES IN SCHEMA hometest TO app_migrator;

GRANT USAGE, SELECT, UPDATE
  ON ALL SEQUENCES IN SCHEMA hometest TO app_migrator;

-- Automatically grant privileges on new tables/sequences
ALTER
  DEFAULT PRIVILEGES IN SCHEMA hometest
  GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLES TO app_migrator;

ALTER
  DEFAULT PRIVILEGES IN SCHEMA hometest
  GRANT USAGE,
  SELECT,
  UPDATE
  ON SEQUENCES TO app_migrator;

-- Required for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Make admin see hometest tables by default
ALTER ROLE admin SET search_path TO hometest;

-- ===========
-- Create an app user
-- ===========
DO
$$
  BEGIN
    IF
      NOT EXISTS (SELECT
                  FROM pg_catalog.pg_roles
                  WHERE rolname = 'app_user') THEN
      CREATE ROLE app_user LOGIN PASSWORD 'STRONG_APP_PASSWORD';
    END IF;
  END
$$;

-- Set the default search path for migrations
ALTER
  ROLE app_user SET search_path TO hometest;

-- Grant schema privileges so the app can use the DB
GRANT USAGE ON SCHEMA
  hometest TO app_user;
GRANT
  SELECT,
  INSERT,
  UPDATE,
  DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON ALL TABLES IN SCHEMA hometest TO app_user;

GRANT USAGE, SELECT, UPDATE
  ON ALL SEQUENCES IN SCHEMA hometest TO app_user;

-- Set default privileges for future tables/sequences
ALTER
  DEFAULT PRIVILEGES IN SCHEMA hometest
  GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLES TO app_user;

ALTER
  DEFAULT PRIVILEGES IN SCHEMA hometest
  GRANT USAGE, SELECT, UPDATE
  ON SEQUENCES TO app_user;

-- Ensure the admin user can create tables in the schema
GRANT CREATE, USAGE ON SCHEMA hometest TO admin;

-- Ensure tables created by app_migrator grant privileges to app_user
ALTER DEFAULT PRIVILEGES FOR ROLE app_migrator IN SCHEMA hometest
  GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLES TO app_user;
