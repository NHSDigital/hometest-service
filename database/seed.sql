SET search_path TO hometest;

INSERT INTO supplier (supplier_id, name, service_url, website_url, client_secret_name, client_id)
VALUES (
  gen_random_uuid(),
  'Test Supplier',
  'http://wiremock:8080',
  'http://example.com',
  'test_supplier_client_secret',
  'test_supplier_client_id'
)
ON CONFLICT DO NOTHING;
