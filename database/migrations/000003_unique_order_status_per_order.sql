-- +goose Up
ALTER TABLE order_status
ADD CONSTRAINT unique_order_status_per_order UNIQUE (order_uid);

-- +goose Down
ALTER TABLE order_status
DROP CONSTRAINT IF EXISTS unique_order_status_per_order;
