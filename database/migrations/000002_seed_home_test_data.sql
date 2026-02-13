-- +goose Up

/*
 =================================================================
 Test data

 This is for data used for testing locally
 =================================================================
 */
INSERT INTO supplier (
  supplier_id,
  name,
  service_url,
  website_url,
  client_secret_name,
  client_id,
  oauth_token_path,
  order_path,
  oauth_scope
)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Preventx',
  'http://wiremock:8080',
  'https://www.preventx.com/',
  'test_supplier_client_secret',
  'preventx-client-id',
  '/api/oauth',
  '/api/order',
  'orders results'
)
ON CONFLICT (supplier_id) DO NOTHING;

INSERT INTO supplier (
  supplier_id,
  name,
  service_url,
  website_url,
  client_secret_name,
  client_id,
  oauth_token_path,
  order_path,
  oauth_scope
)
VALUES (
  '77777777-7777-7777-7777-777777777777',
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
  ('FIT', 'Immunochemical Test'),
  ('PCR', 'Polymerase Chain Reaction')
ON CONFLICT (test_code) DO NOTHING;

INSERT INTO status_type (status_code, description)
VALUES
  ('CREATED', 'Order created'),
  ('DISPATCHED', 'Test kit dispatched'),
  ('COMPLETED', 'Order completed')
ON CONFLICT (status_code) DO NOTHING;

INSERT INTO result_type (result_code, description)
VALUES
  ('PENDING', 'Awaiting result'),
  ('NEGATIVE', 'No condition detected'),
  ('POSITIVE', 'Condition detected')
ON CONFLICT (result_code) DO NOTHING;

INSERT INTO patient_mapping (uid, nhs_number, birth_date)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  '9999999999',
  DATE '1988-03-15'
)
ON CONFLICT (nhs_number) DO NOTHING;

INSERT INTO patient_mapping (uid, nhs_number, birth_date)
VALUES (
  '88888888-8888-8888-8888-888888888888',
  '8888888888',
  DATE '1992-11-07'
)
ON CONFLICT (nhs_number) DO NOTHING;

INSERT INTO la_supplier_offering (offering_id, supplier_id, test_code, la_code)
VALUES
  (
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    'FIT',
    'E09000001'
  ),
  (
    '33333333-3333-3333-3333-333333333334',
    '11111111-1111-1111-1111-111111111111',
    'PCR',
    'E09000001'
  ),
  (
    '33333333-3333-3333-3333-333333333335',
    '77777777-7777-7777-7777-777777777777',
    'FIT',
    'E09000001'
  ),
  (
    '33333333-3333-3333-3333-333333333336',
    '77777777-7777-7777-7777-777777777777',
    'PCR',
    'E09000001'
  )
ON CONFLICT (la_code, supplier_id, test_code) DO NOTHING;

INSERT INTO "order" (order_uid, supplier_id, patient_uid, test_code, originator)
VALUES (
  '44444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  'FIT',
  'seed-migration'
)
ON CONFLICT (order_uid) DO NOTHING;

INSERT INTO "order" (order_uid, supplier_id, patient_uid, test_code, originator)
VALUES (
  '99999999-9999-9999-9999-999999999999',
  '77777777-7777-7777-7777-777777777777',
  '88888888-8888-8888-8888-888888888888',
  'PCR',
  'seed-migration'
)
ON CONFLICT (order_uid) DO NOTHING;

INSERT INTO order_status (status_id, order_uid, order_reference, status_code)
VALUES (
  '55555555-5555-5555-5555-555555555555',
  '44444444-4444-4444-4444-444444444444',
  NULL,
  'CREATED'
)
ON CONFLICT (status_id) DO NOTHING;

INSERT INTO order_status (status_id, order_uid, order_reference, status_code)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '99999999-9999-9999-9999-999999999999',
  NULL,
  'CREATED'
)
ON CONFLICT (status_id) DO NOTHING;

INSERT INTO result_status (order_uid, status, correlation_id)
VALUES (
  '44444444-4444-4444-4444-444444444444',
  'PENDING',
  '66666666-6666-6666-6666-666666666666'
)
ON CONFLICT (correlation_id) DO NOTHING;

INSERT INTO result_status (order_uid, status, correlation_id)
VALUES (
  '99999999-9999-9999-9999-999999999999',
  'PENDING',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
)
ON CONFLICT (correlation_id) DO NOTHING;

-- +goose Down
DELETE FROM result_status WHERE correlation_id = '66666666-6666-6666-6666-666666666666';
DELETE FROM result_status WHERE correlation_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
DELETE FROM order_status WHERE status_id = '55555555-5555-5555-5555-555555555555';
DELETE FROM order_status WHERE status_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
DELETE FROM "order" WHERE order_uid = '44444444-4444-4444-4444-444444444444';
DELETE FROM "order" WHERE order_uid = '99999999-9999-9999-9999-999999999999';
DELETE FROM la_supplier_offering
WHERE offering_id IN (
  '33333333-3333-3333-3333-333333333333',
  '33333333-3333-3333-3333-333333333334',
  '33333333-3333-3333-3333-333333333335',
  '33333333-3333-3333-3333-333333333336'
);
DELETE FROM patient_mapping WHERE uid = '22222222-2222-2222-2222-222222222222';
DELETE FROM patient_mapping WHERE uid = '88888888-8888-8888-8888-888888888888';
DELETE FROM supplier WHERE supplier_id = '11111111-1111-1111-1111-111111111111';
DELETE FROM supplier WHERE supplier_id = '77777777-7777-7777-7777-777777777777';
DELETE FROM result_type WHERE result_code IN ('PENDING', 'NEGATIVE', 'POSITIVE');
DELETE FROM status_type WHERE status_code IN ('CREATED', 'DISPATCHED', 'COMPLETED');
DELETE FROM test_type WHERE test_code IN ('FIT', 'PCR');
