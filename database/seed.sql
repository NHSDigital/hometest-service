SET search_path TO hometest;

INSERT INTO supplier (supplier_id, name, service_url, website_url, secret_name)
VALUES (
  gen_random_uuid(),
  'Test Supplier',
  'http://wiremock:8080',
  'http://example.com',
  'test_supplier_secret'
)
ON CONFLICT DO NOTHING;
