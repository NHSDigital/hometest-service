/* @name checkIdempotency */
SELECT 1 AS exists
FROM hometest.order_status
WHERE order_uid = :order_uid::uuid
AND correlation_id = :correlation_id::uuid
LIMIT 1;
