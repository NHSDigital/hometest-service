SET search_path TO hometest;

INSERT INTO supplier (supplier_id, name, service_url, website_url, client_secret_name, client_id, oauth_token_path, order_path, oauth_scope)
VALUES (
  gen_random_uuid(),
  'Test Supplier',
  'http://wiremock:8080',
  'http://example.com',
  'test_supplier_client_secret',
  'test_supplier_client_id',
  '/oauth/token',
  '/order',
  'orders results'
)
ON CONFLICT DO NOTHING;
