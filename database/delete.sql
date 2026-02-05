-- Terminate existing connections to allow drop
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'mydb'
  AND pid <> pg_backend_pid();

DROP DATABASE IF EXISTS mydb;
CREATE DATABASE mydb;
