/* @name getPatientIdFromOrder */
SELECT patient_uid
FROM hometest.test_order
WHERE order_uid = :order_uid::uuid
LIMIT 1;
