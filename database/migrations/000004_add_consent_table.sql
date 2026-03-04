-- +goose Up
CREATE TABLE consent
(
  consent_uid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_uuid uuid NOT NULL REFERENCES test_order (order_uid) ON DELETE RESTRICT,
  created_at timestamp with time zone NOT NULL DEFAULT current_timestamp
);


-- +goose Down
DROP TABLE consent;
