-- +goose Up
CREATE TABLE patient_mapping
(
  uid          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nhs_number   VARCHAR(50) UNIQUE,
  birth_date   DATE NOT NULL
);

CREATE TABLE test_type
(
  test_code   VARCHAR(50) PRIMARY KEY,
  description TEXT NOT NULL
);

CREATE TABLE supplier
(
  supplier_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  service_url VARCHAR(255) NOT NULL,
  website_url VARCHAR(255),
  client_secret_name VARCHAR(255) NOT NULL,
  client_id    VARCHAR(255) NOT NULL,
  oauth_token_path VARCHAR(255),
  order_path VARCHAR(255),
  oauth_scope VARCHAR(255)
);

CREATE TABLE la_supplier_offering
(
  offering_id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id    uuid REFERENCES supplier (supplier_id),
  test_code      VARCHAR(50) REFERENCES test_type (test_code),
  la_code        VARCHAR(10) NOT NULL,
  effective_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT unique_la_offering UNIQUE (la_code, supplier_id, test_code)
);

CREATE TABLE "order"
(
  order_uid   uuid PRIMARY KEY         DEFAULT gen_random_uuid(),
  order_reference BIGINT GENERATED ALWAYS AS IDENTITY (START WITH 100000) UNIQUE,
  supplier_id uuid        NOT NULL REFERENCES supplier (supplier_id),
  patient_uid uuid        NOT NULL REFERENCES patient_mapping (uid),
  test_code   VARCHAR(50) NOT NULL REFERENCES test_type (test_code),
  originator  VARCHAR(255),
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE status_type
(
  status_code VARCHAR(50) PRIMARY KEY,
  description TEXT NOT NULL
);

CREATE TABLE order_status
(
  status_id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_uid   uuid        NOT NULL REFERENCES "order" (order_uid) ON DELETE CASCADE,
  order_reference BIGINT,
  status_code VARCHAR(50) NOT NULL REFERENCES status_type (status_code),
  "timestamp" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE result_type (
  result_code VARCHAR(50) PRIMARY KEY,
  description TEXT NOT NULL
);

CREATE TABLE result_status
(
  result_id      BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  order_uid      uuid        NOT NULL REFERENCES "order" (order_uid) ON DELETE CASCADE,
  status         VARCHAR(50) NOT NULL REFERENCES result_type (result_code),
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  correlation_id uuid        NOT NULL UNIQUE
);

CREATE INDEX idx_order_patient_uid ON "order" (patient_uid);
CREATE INDEX idx_order_supplier_id ON "order" (supplier_id);
CREATE INDEX idx_order_status_order_uid ON order_status (order_uid);
CREATE INDEX idx_result_status_order_uid ON result_status (order_uid);
CREATE INDEX idx_patient_nhs_number ON patient_mapping (nhs_number);
CREATE INDEX idx_result_status_correlation_id ON result_status (correlation_id);


-- +goose Down
DROP TABLE patient_mapping;
DROP TABLE test_type;
DROP TABLE supplier;
DROP TABLE la_supplier_offering;
DROP TABLE "order";
DROP TABLE status_type;
DROP TABLE order_status;
DROP TABLE result_type;
DROP TABLE result_status;
