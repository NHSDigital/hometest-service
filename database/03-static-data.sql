SET search_path TO hometest;

/*
 =================================================================
 STATIC DATA

 This is for data that will not change between local and PoC env
 =================================================================
 */

INSERT INTO status_type(status_code, description)
VALUES
  ('ORDER_RECEIVED', 'Order has been confirmed by the supplier'),
  ('DISPATCHED', 'Test has been dispatched to the patient'),
  ('RECEIVED', 'Test has been received by the laboratory'),
  ('COMPLETE', 'Test results are ready from the supplier')
ON CONFLICT DO NOTHING;

INSERT INTO result_type(result_code, description)
VALUES
  ('RESULT_AVAILABLE', 'Test results are available from the supplier'),
  ('RESULT_WITHHELD', 'Test result are being withheld by the supplier for any reason')
ON CONFLICT DO NOTHING;
