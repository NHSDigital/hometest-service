SET search_path TO hometest;

-- Patient Mapping
CREATE TABLE IF NOT EXISTS patient_mapping
(
  uid          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nhs_login_id uuid UNIQUE,
  dob          DATE NOT NULL
);

-- Tests
CREATE TABLE IF NOT EXISTS test_type
(
  test_code   VARCHAR(50) PRIMARY KEY,
  description TEXT NOT NULL
);

-- Suppliers and Offerings
CREATE TABLE IF NOT EXISTS supplier
(
  supplier_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  service_url VARCHAR(255),
  website_url VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS la_supplier_offering
(
  offering_id    BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  supplier_id    uuid REFERENCES supplier (supplier_id),
  test_code      VARCHAR(50) REFERENCES test_type (test_code),
  la_code        VARCHAR(10) NOT NULL,
  effective_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT unique_la_offering UNIQUE (la_code, supplier_id, test_code)
);

-- Orders and Statuses
CREATE TABLE IF NOT EXISTS "order"
(
  order_uid   uuid PRIMARY KEY         DEFAULT gen_random_uuid(),
  supplier_id uuid        NOT NULL REFERENCES supplier (supplier_id),
  patient_uid uuid        NOT NULL REFERENCES patient_mapping (uid),
  test_code   VARCHAR(50) NOT NULL REFERENCES test_type (test_code),
  originator  VARCHAR(255),
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS status_type
(
  status_code VARCHAR(50) PRIMARY KEY,
  description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS order_status
(
  status_id   BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  order_uid   uuid        NOT NULL REFERENCES "order" (order_uid) ON DELETE CASCADE,
  status_code VARCHAR(50) NOT NULL REFERENCES status_type (status_code),
  "timestamp" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS result_status
(
  result_id   BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  order_uid   uuid        NOT NULL REFERENCES "order" (order_uid) ON DELETE CASCADE,
  status_code VARCHAR(50) NOT NULL REFERENCES status_type (status_code),
  "timestamp" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_order_patient_uid ON "order" (patient_uid);
CREATE INDEX IF NOT EXISTS idx_order_supplier_id ON "order" (supplier_id);
CREATE INDEX IF NOT EXISTS idx_order_status_order_uid ON order_status (order_uid);
CREATE INDEX IF NOT EXISTS idx_result_status_order_uid ON result_status (order_uid);
CREATE INDEX IF NOT EXISTS idx_patient_nhs_number ON patient_mapping (nhs_login_id);
