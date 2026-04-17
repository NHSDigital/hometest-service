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

-- +goose Down
DROP VIEW IF EXISTS latest_order_status;
