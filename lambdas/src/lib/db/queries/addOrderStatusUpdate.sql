/* @name addOrderStatusUpdate */
INSERT INTO hometest.order_status (order_uid, status_code, created_at, correlation_id)
VALUES (:order_uid::uuid, :status_code::text, :created_at::timestamptz, :correlation_id::uuid);
