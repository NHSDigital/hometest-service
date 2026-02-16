-- Terminate existing connections to allow drop
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE
    datname = 'local_hometest_db'
    AND pid <> pg_backend_pid();

DROP DATABASE IF EXISTS local_hometest_db;
CREATE DATABASE local_hometest_db;
