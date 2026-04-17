-- +goose Up
CREATE OR REPLACE VIEW latest_order_status AS
SELECT DISTINCT ON (order_uid)
  status_id,
  order_uid,
  status_code,
  created_at,
  correlation_id
FROM order_status
ORDER BY order_uid ASC, created_at DESC;

CREATE INDEX IF NOT EXISTS idx_order_status_order_uid_created_at ON order_status (order_uid ASC, created_at DESC);

-- +goose Down
DROP INDEX IF EXISTS idx_order_status_order_uid_created_at;
DROP VIEW IF EXISTS latest_order_status;
