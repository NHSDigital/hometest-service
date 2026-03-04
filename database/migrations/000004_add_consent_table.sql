-- +goose Up
CREATE TABLE consent
(
  consent_uid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_uid uuid NOT NULL REFERENCES test_order (order_uid) ON DELETE RESTRICT,
  created_at timestamp with time zone NOT NULL DEFAULT current_timestamp
);

CREATE INDEX idx_consent_order_uid ON consent (order_uid);


-- +goose Down
DROP INDEX idx_consent_order_uid;
DROP TABLE consent;
