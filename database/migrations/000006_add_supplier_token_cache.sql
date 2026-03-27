-- +goose Up
CREATE TABLE supplier_token_cache (
  cache_key varchar(500) PRIMARY KEY,
  access_token text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT current_timestamp
);

-- +goose Down
DROP TABLE supplier_token_cache;
