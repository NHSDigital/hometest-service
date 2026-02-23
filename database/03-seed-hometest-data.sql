/*
 =================================================================
 Test data

 This is for data used for testing locally
 =================================================================
 */

SET search_path TO hometest;

INSERT INTO supplier (
  supplier_id,
  supplier_name,
  service_url,
  website_url,
  client_secret_name,
  client_id,
  oauth_token_path,
  order_path,
  oauth_scope
)
VALUES (
  'c1a2b3c4-1234-4def-8abc-123456789abc',
  'Preventx',
  'http://wiremock:8080',
  'https://www.preventx.com/',
  'test_supplier_client_secret',
  'preventx-client-id',
  '/oauth/token',
  '/order',
  'orders results'
)
ON CONFLICT (supplier_id) DO NOTHING;

INSERT INTO supplier (
  supplier_id,
  supplier_name,
  service_url,
  website_url,
  client_secret_name,
  client_id,
  oauth_token_path,
  order_path,
  oauth_scope
)
VALUES (
  'd2b3c4d5-2345-4abc-8def-23456789abcd',
  'SH:24',
  'http://wiremock:8080',
  'https://sh24.org.uk/',
  'test_supplier_client_secret',
  'sh24-client-id',
  '/oauth/token',
  '/order',
  'order results'
)
ON CONFLICT (supplier_id) DO NOTHING;

INSERT INTO test_type (test_code, description)
VALUES
('31676001', 'HIV antigen test'),
('PCR', 'Polymerase Chain Reaction')
ON CONFLICT (test_code) DO NOTHING;

INSERT INTO patient_mapping (patient_uid, nhs_number, birth_date)
VALUES (
  'e3c4d5e6-3456-4bcd-8efa-3456789abcde',
  '9999999999',
  DATE '1988-03-15'
)
ON CONFLICT (nhs_number) DO NOTHING;

INSERT INTO patient_mapping (patient_uid, nhs_number, birth_date)
VALUES (
  'f4d5e6f7-4567-4cde-8fab-456789abcdef',
  '8888888888',
  DATE '1992-11-07'
)
ON CONFLICT (nhs_number) DO NOTHING;

INSERT INTO la_supplier_offering (offering_id, supplier_id, test_code, la_code, effective_from)
VALUES
('a5e6f7a8-5678-4def-8abc-56789abcdefa', 'c1a2b3c4-1234-4def-8abc-123456789abc', '31676001', '1440', DATE '2026-02-09'),
('b6f7a8b9-6789-4efa-8bcd-6789abcdefab', 'c1a2b3c4-1234-4def-8abc-123456789abc', 'PCR', '1440', DATE '2026-02-09'),
('c7a8b9c0-7890-4fab-8cde-789abcdefabc', 'd2b3c4d5-2345-4abc-8def-23456789abcd', '31676001', '4230', DATE '2026-02-09'),
('d8b9c0d1-8901-4abc-8def-89abcdefabcd', 'd2b3c4d5-2345-4abc-8def-23456789abcd', 'PCR', '4230', DATE '2026-02-09')
ON CONFLICT (la_code, supplier_id, test_code) DO NOTHING;

INSERT INTO test_order (order_uid, supplier_id, patient_uid, test_code, originator)
VALUES (
  'e9c0d1e2-9012-4bcd-8efa-90abcdefabcd',
  'c1a2b3c4-1234-4def-8abc-123456789abc',
  'e3c4d5e6-3456-4bcd-8efa-3456789abcde',
  '31676001',
  'seed-migration'
)
ON CONFLICT (order_uid) DO NOTHING;

INSERT INTO test_order (order_uid, supplier_id, patient_uid, test_code, originator)
VALUES (
  'fab1c2d3-0123-4cde-8fab-01abcdefabcd',
  'd2b3c4d5-2345-4abc-8def-23456789abcd',
  'f4d5e6f7-4567-4cde-8fab-456789abcdef',
  'PCR',
  'seed-migration'
)
ON CONFLICT (order_uid) DO NOTHING;

INSERT INTO order_status (status_id, order_uid, order_reference, status_code)
VALUES (
  'abc2d3e4-1234-4def-8abc-12abcdefabcd',
  'e9c0d1e2-9012-4bcd-8efa-90abcdefabcd',
  NULL,
  'ORDER_RECEIVED'
)
ON CONFLICT (status_id) DO NOTHING;

INSERT INTO order_status (status_id, order_uid, order_reference, status_code)
VALUES (
  'bcd3e4f5-2345-4abc-8def-23abcdefabcd',
  'fab1c2d3-0123-4cde-8fab-01abcdefabcd',
  NULL,
  'ORDER_RECEIVED'
)
ON CONFLICT (status_id) DO NOTHING;

INSERT INTO result_status (order_uid, status, correlation_id)
VALUES (
  'e9c0d1e2-9012-4bcd-8efa-90abcdefabcd',
  'RESULT_AVAILABLE',
  'cde4f5a6-3456-4bcd-8efa-34abcdefabcd'
)
ON CONFLICT (correlation_id) DO NOTHING;

INSERT INTO result_status (order_uid, status, correlation_id)
VALUES (
  'fab1c2d3-0123-4cde-8fab-01abcdefabcd',
  'RESULT_AVAILABLE',
  'def5a6b7-4567-4cde-8fab-45abcdefabcd'
)
ON CONFLICT (correlation_id) DO NOTHING;
